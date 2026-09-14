import { createGame } from './machine'
import type { BallotType, GamePhase, GameState, OutfitId, RoundNumber, SeatId } from './types'

export const STORAGE_KEY = 'who-is-ai-v2.4'

const seats: SeatId[] = ['A', 'B', 'C', 'D']
const outfits: OutfitId[] = ['blue', 'green', 'yellow', 'purple']
const phases: GamePhase[] = ['landing', 'lobby', 'reading', 'round1Write', 'round1Public', 'round1Vote', 'round2Write', 'round2Public', 'round2Vote', 'round3Write', 'round3Public', 'round3QualityVote', 'finalIdentityVote', 'reveal', 'settlement']
const ballots: BallotType[] = ['round1Identity', 'round2Quality', 'round3Quality', 'finalIdentity']

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isSeat(value: unknown): value is SeatId {
  return typeof value === 'string' && seats.includes(value as SeatId)
}

function validPartialSeatMap(value: unknown, valueCheck: (entry: unknown) => boolean) {
  if (!isRecord(value)) return false
  return Object.entries(value).every(([key, entry]) => isSeat(key) && valueCheck(entry))
}

export function isGameState(value: unknown): value is GameState {
  if (!isRecord(value) || value.version !== 1 || typeof value.gameId !== 'string' || !value.gameId) return false
  if (!phases.includes(value.phase as GamePhase) || !isSeat(value.userSeat) || !isSeat(value.aiSeat)) return false
  if (!Number.isInteger(value.rematchIndex) || !Number.isFinite(value.secondsLeft)) return false
  const outfitBySeat = value.outfitBySeat
  if (!isRecord(outfitBySeat) || !seats.every(seat => outfits.includes(outfitBySeat[seat] as OutfitId))) return false
  const submissions = value.submissions
  const drafts = value.drafts
  if (!isRecord(submissions) || !isRecord(drafts)) return false
  for (const round of [1, 2, 3] as RoundNumber[]) {
    if (!validPartialSeatMap(submissions[round], entry => typeof entry === 'string')) return false
    if (typeof drafts[round] !== 'string') return false
  }
  const ballotMap = value.ballots
  if (!isRecord(ballotMap) || !ballots.every(ballot => validPartialSeatMap(ballotMap[ballot], isSeat))) return false
  if (!isRecord(value.selections) || !Object.entries(value.selections).every(([key, entry]) => ballots.includes(key as BallotType) && isSeat(entry))) return false
  if (typeof value.paused !== 'boolean' || (value.speed !== 1 && value.speed !== 5) || typeof value.graceUsed !== 'boolean' || typeof value.gameValid !== 'boolean' || typeof value.settled !== 'boolean') return false
  return true
}

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createGame()
    const value: unknown = JSON.parse(raw)
    if (!isGameState(value)) return createGame()
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
