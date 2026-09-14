import { CONTENT_IDS, ROUND_TOPICS, ROUNDS, SEATS } from './data'
import { countVisibleCharacters } from './graphemes'
import { authorForContent, createGame } from './machine'
import type { ContentId, GamePhase, GameState, OutfitId, RoundContentSlot, RoundNumber, SeatId } from './types'

export const STORAGE_KEY = 'who-is-ai-v4'

const outfits: OutfitId[] = ['blue', 'green', 'yellow', 'purple']
const phases: GamePhase[] = ['landing', 'lobby', 'round1Read', 'round1Write', 'round1Vote', 'round2Read', 'round2Write', 'round2Vote', 'round3Read', 'round3Write', 'round3Vote', 'settlement']

function migrateRemovedRevealPhase(value: unknown): unknown {
  if (!isRecord(value)) return value
  if (value.phase === 'round1Reveal') return { ...value, phase: 'round2Read', secondsLeft: 0, graceUsed: false, notice: undefined }
  if (value.phase === 'round2Reveal') return { ...value, phase: 'round3Read', secondsLeft: 0, graceUsed: false, notice: undefined }
  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isSeat(value: unknown): value is SeatId {
  return typeof value === 'string' && SEATS.includes(value as SeatId)
}

function isContentId(value: unknown): value is ContentId {
  return typeof value === 'string' && CONTENT_IDS.includes(value as ContentId)
}

function isValidSlots(value: unknown): value is RoundContentSlot[] {
  if (!Array.isArray(value) || value.length !== 4) return false
  if (!value.every(slot => isRecord(slot) && isContentId(slot.contentId) && isSeat(slot.authorSeat))) return false
  return new Set(value.map(slot => slot.contentId)).size === 4 && new Set(value.map(slot => slot.authorSeat)).size === 4
}

function validPartialSeatMap(value: unknown, valueCheck: (entry: unknown) => boolean) {
  if (!isRecord(value)) return false
  return Object.entries(value).every(([key, entry]) => isSeat(key) && valueCheck(entry))
}

export function isGameState(value: unknown): value is GameState {
  if (!isRecord(value) || value.version !== 3 || typeof value.gameId !== 'string' || !value.gameId) return false
  if (!phases.includes(value.phase as GamePhase) || !isSeat(value.userSeat) || !isSeat(value.aiSeat) || value.userSeat === value.aiSeat) return false
  if (!Number.isInteger(value.rematchIndex) || !Number.isFinite(value.secondsLeft)) return false

  const outfitBySeat = value.outfitBySeat
  if (!isRecord(outfitBySeat) || !SEATS.every(seat => outfits.includes(outfitBySeat[seat] as OutfitId))) return false

  const contentSlots = value.contentSlots
  const submissions = value.submissions
  const drafts = value.drafts
  const ballotMap = value.ballots
  if (!isRecord(contentSlots) || !isRecord(submissions) || !isRecord(drafts) || !isRecord(ballotMap)) return false

  for (const round of ROUNDS) {
    if (!isValidSlots(contentSlots[round])) return false
    if (!validPartialSeatMap(submissions[round], entry => typeof entry === 'string' && countVisibleCharacters(entry) <= ROUND_TOPICS[round].maxChars)) return false
    if (typeof drafts[round] !== 'string') return false
    if (!validPartialSeatMap(ballotMap[round], isContentId)) return false
    const ballots = ballotMap[round] as Record<string, unknown>
    if (ballots[value.aiSeat as string] !== undefined) return false
    for (const [voter, contentId] of Object.entries(ballots)) {
      if (authorForContent(contentSlots[round] as RoundContentSlot[], contentId as ContentId) === voter) return false
    }
  }

  if (!['idle', 'loading', 'ready', 'error'].includes(value.aiContentStatus as string)) return false
  if (value.aiContentSource !== undefined && value.aiContentSource !== 'preset' && value.aiContentSource !== 'model') return false
  if (value.aiContentError !== undefined && typeof value.aiContentError !== 'string') return false
  if (typeof value.paused !== 'boolean' || (value.speed !== 1 && value.speed !== 5) || typeof value.graceUsed !== 'boolean' || typeof value.gameValid !== 'boolean' || typeof value.settled !== 'boolean') return false
  return true
}

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createGame()
    const value: unknown = migrateRemovedRevealPhase(JSON.parse(raw))
    if (!isGameState(value)) return createGame()
    if (value.phase === 'landing') return createGame()
    if (value.aiContentStatus === 'loading') return { ...value, aiContentStatus: 'idle' }
    return value
  } catch {
    return createGame()
  }
}

export function saveGame(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}
