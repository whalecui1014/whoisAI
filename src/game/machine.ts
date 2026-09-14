import { CONTENT_IDS, PHASE_SECONDS, ROUND_TOPICS, ROUNDS, SCRIPTED_SUBMISSIONS, SEATS } from './data'
import { validateSubmission } from './graphemes'
import type { ContentId, GameBallots, GamePhase, GameState, GeneratedGameContent, OutfitId, RoundContentSlot, RoundNumber, RoundSlots, SeatId } from './types'

export type GameAction =
  | { type: 'START' }
  | { type: 'READY' }
  | { type: 'START_WRITING'; round: RoundNumber }
  | { type: 'PHASE_EXPIRED'; from: GamePhase }
  | { type: 'AI_CONTENT_REQUEST' }
  | { type: 'AI_CONTENT_SUCCESS'; gameId: string; content: GeneratedGameContent }
  | { type: 'AI_CONTENT_FAILURE'; gameId: string; message: string }
  | { type: 'AI_CONTENT_RETRY' }
  | { type: 'DRAFT'; round: RoundNumber; value: string }
  | { type: 'SUBMIT'; round: RoundNumber }
  | { type: 'CAST_VOTE'; round: RoundNumber; contentId: ContentId }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'TOGGLE_SPEED' }
  | { type: 'TICK' }
  | { type: 'RESET' }
  | { type: 'REMATCH' }
  | { type: 'CLEAR_NOTICE' }

const layouts: Array<{ userSeat: SeatId; aiSeat: SeatId; outfits: Record<SeatId, OutfitId> }> = [
  { userSeat: 'A', aiSeat: 'D', outfits: { A: 'blue', B: 'green', C: 'yellow', D: 'purple' } },
  { userSeat: 'C', aiSeat: 'A', outfits: { A: 'yellow', B: 'blue', C: 'purple', D: 'green' } },
  { userSeat: 'B', aiSeat: 'C', outfits: { A: 'purple', B: 'yellow', C: 'green', D: 'blue' } },
]

const writePhaseByRound: Record<RoundNumber, GamePhase> = { 1: 'round1Write', 2: 'round2Write', 3: 'round3Write' }
const votePhaseByRound: Record<RoundNumber, GamePhase> = { 1: 'round1Vote', 2: 'round2Vote', 3: 'round3Vote' }
const readPhaseByRound: Record<RoundNumber, GamePhase> = { 1: 'round1Read', 2: 'round2Read', 3: 'round3Read' }

function newId(index: number) {
  return `game-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 7)}`
}

function seededShuffle(seedText: string): SeatId[] {
  let seed = 2166136261
  for (const char of seedText) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619)
  const values = [...SEATS]
  for (let index = values.length - 1; index > 0; index--) {
    seed += 0x6d2b79f5
    let value = seed
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    const random = ((value ^ (value >>> 14)) >>> 0) / 4294967296
    const swapIndex = Math.floor(random * (index + 1))
    ;[values[index], values[swapIndex]] = [values[swapIndex], values[index]]
  }
  return values
}

function makeContentSlots(gameId: string): RoundSlots {
  return Object.fromEntries(ROUNDS.map(round => [round, seededShuffle(`${gameId}:round:${round}`).map((authorSeat, index) => ({
    contentId: CONTENT_IDS[index],
    authorSeat,
  }))])) as unknown as RoundSlots
}

export function authorForContent(slots: RoundContentSlot[], contentId: ContentId): SeatId | undefined {
  return slots.find(slot => slot.contentId === contentId)?.authorSeat
}

export function contentForAuthor(slots: RoundContentSlot[], seat: SeatId): ContentId | undefined {
  return slots.find(slot => slot.authorSeat === seat)?.contentId
}

function makeSimulatedBallots(userSeat: SeatId, aiSeat: SeatId, slots: RoundSlots): GameBallots {
  const simulatedHumans = SEATS.filter(seat => seat !== userSeat && seat !== aiSeat)
  const [beta, gamma] = simulatedHumans
  const targetAuthors: Record<RoundNumber, Array<[SeatId, SeatId]>> = {
    1: [[beta, aiSeat], [gamma, aiSeat]],
    2: [[beta, gamma], [gamma, aiSeat]],
    3: [[beta, aiSeat], [gamma, beta]],
  }
  return Object.fromEntries(ROUNDS.map(round => [round, Object.fromEntries(targetAuthors[round].map(([voter, target]) => [
    voter,
    contentForAuthor(slots[round], target),
  ]))])) as GameBallots
}

export function createGame(rematchIndex = 0, phase: GamePhase = 'landing'): GameState {
  const layout = layouts[rematchIndex % layouts.length]
  const gameId = newId(rematchIndex)
  const contentSlots = makeContentSlots(gameId)
  const submissions = {
    1: { ...SCRIPTED_SUBMISSIONS[1] },
    2: { ...SCRIPTED_SUBMISSIONS[2] },
    3: { ...SCRIPTED_SUBMISSIONS[3] },
  }
  for (const round of ROUNDS) {
    delete submissions[round][layout.userSeat]
    delete submissions[round][layout.aiSeat]
  }

  return {
    version: 3,
    gameId,
    rematchIndex,
    phase,
    userSeat: layout.userSeat,
    aiSeat: layout.aiSeat,
    outfitBySeat: layout.outfits,
    contentSlots,
    submissions,
    drafts: { 1: '', 2: '', 3: '' },
    ballots: makeSimulatedBallots(layout.userSeat, layout.aiSeat, contentSlots),
    aiContentStatus: 'idle',
    paused: false,
    speed: 1,
    secondsLeft: PHASE_SECONDS[phase],
    graceUsed: false,
    gameValid: true,
    settled: phase === 'settlement',
  }
}

function phaseRound(phase: GamePhase): RoundNumber | null {
  if (phase.startsWith('round1')) return 1
  if (phase.startsWith('round2')) return 2
  if (phase.startsWith('round3')) return 3
  return null
}

function requiredActionComplete(state: GameState): boolean {
  const round = phaseRound(state.phase)
  if (!round) return true
  if (state.phase === writePhaseByRound[round]) return Boolean(state.submissions[round][state.userSeat])
  if (state.phase === votePhaseByRound[round]) return Boolean(state.ballots[round][state.userSeat])
  return true
}

function missingActionMessage(state: GameState): string {
  const round = phaseRound(state.phase)
  if (round && state.phase === writePhaseByRound[round]) return '请先提交本轮内容。'
  if (round && state.phase === votePhaseByRound[round]) return '请先投票。'
  return '请先完成当前操作。'
}

function nextPhase(phase: GamePhase): GamePhase {
  const map: Partial<Record<GamePhase, GamePhase>> = {
    round1Write: 'round1Vote',
    round1Vote: 'round2Read',
    round2Write: 'round2Vote',
    round2Vote: 'round3Read',
    round3Write: 'round3Vote',
    round3Vote: 'settlement',
  }
  return map[phase] ?? phase
}

function move(state: GameState, phase: GamePhase): GameState {
  return {
    ...state,
    phase,
    secondsLeft: PHASE_SECONDS[phase],
    graceUsed: false,
    notice: undefined,
    settled: phase === 'settlement' ? true : state.settled,
  }
}

function expirePhase(state: GameState): GameState {
  if (state.phase === 'landing' || state.phase === 'lobby' || state.phase === 'settlement' || state.phase.endsWith('Read')) return state
  if (requiredActionComplete(state)) return move(state, nextPhase(state.phase))
  if (!state.graceUsed) return { ...state, secondsLeft: 10, graceUsed: true, notice: '还没完成，再给你 10 秒。' }
  return {
    ...state,
    secondsLeft: 0,
    gameValid: false,
    invalidReason: '加时结束后仍未完成提交或投票，这局不计分。',
    phase: 'settlement',
    settled: true,
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START': return state.phase === 'landing' ? move(state, 'lobby') : state
    case 'READY': return state.phase === 'lobby' && state.aiContentStatus === 'ready' ? move(state, 'round1Read') : state
    case 'START_WRITING': return state.phase === readPhaseByRound[action.round]
      ? move(state, writePhaseByRound[action.round])
      : state
    case 'AI_CONTENT_REQUEST': return state.phase === 'lobby' && state.aiContentStatus === 'idle'
      ? { ...state, aiContentStatus: 'loading', aiContentError: undefined }
      : state
    case 'AI_CONTENT_SUCCESS': {
      if (state.phase !== 'lobby' || state.gameId !== action.gameId || state.aiContentStatus !== 'loading') return state
      const submissions = { ...state.submissions }
      for (const round of ROUNDS) submissions[round] = { ...submissions[round], [state.aiSeat]: action.content.submissions[round] }
      return {
        ...state,
        submissions,
        aiContentStatus: 'ready',
        aiContentSource: action.content.source,
        aiContentError: undefined,
      }
    }
    case 'AI_CONTENT_FAILURE': return state.phase === 'lobby' && state.gameId === action.gameId && state.aiContentStatus === 'loading'
      ? { ...state, aiContentStatus: 'error', aiContentError: action.message }
      : state
    case 'AI_CONTENT_RETRY': return state.phase === 'lobby' && state.aiContentStatus === 'error'
      ? { ...state, aiContentStatus: 'idle', aiContentError: undefined }
      : state
    case 'DRAFT': return state.phase === writePhaseByRound[action.round] && !state.submissions[action.round][state.userSeat]
      ? { ...state, drafts: { ...state.drafts, [action.round]: action.value }, notice: undefined }
      : state
    case 'SUBMIT': {
      if (state.phase !== writePhaseByRound[action.round] || state.submissions[action.round][state.userSeat]) return state
      const error = validateSubmission(state.drafts[action.round], ROUND_TOPICS[action.round].maxChars)
      if (error) return { ...state, notice: error }
      return {
        ...state,
        submissions: {
          ...state.submissions,
          [action.round]: { ...state.submissions[action.round], [state.userSeat]: state.drafts[action.round] },
        },
        notice: undefined,
      }
    }
    case 'CAST_VOTE': {
      if (state.phase !== votePhaseByRound[action.round]) return state
      if (state.ballots[action.round][state.userSeat]) return state
      const author = authorForContent(state.contentSlots[action.round], action.contentId)
      if (!author) return { ...state, notice: '这条内容不存在，请重试。' }
      if (author === state.userSeat) return { ...state, notice: '不能投自己。' }
      return {
        ...state,
        ballots: {
          ...state.ballots,
          [action.round]: { ...state.ballots[action.round], [state.userSeat]: action.contentId },
        },
        notice: undefined,
      }
    }
    case 'PHASE_EXPIRED': {
      if (state.phase !== action.from) return state
      if (!requiredActionComplete(state)) return { ...state, notice: missingActionMessage(state) }
      return expirePhase({ ...state, secondsLeft: 0 })
    }
    case 'TOGGLE_PAUSE': return { ...state, paused: !state.paused }
    case 'TOGGLE_SPEED': return { ...state, speed: state.speed === 1 ? 5 : 1 }
    case 'TICK': {
      if (state.paused || state.secondsLeft <= 0 || state.phase === 'landing' || state.phase === 'lobby' || state.phase === 'settlement' || state.phase.endsWith('Read')) return state
      const next = Math.max(0, state.secondsLeft - state.speed)
      if (next > 0) return { ...state, secondsLeft: next }
      return expirePhase({ ...state, secondsLeft: 0 })
    }
    case 'RESET': return createGame(0, 'landing')
    case 'REMATCH': return state.phase === 'settlement' ? createGame(state.rematchIndex + 1, 'lobby') : state
    case 'CLEAR_NOTICE': return { ...state, notice: undefined }
    default: return state
  }
}

export function completeBallots(state: GameState): GameBallots {
  return structuredClone(state.ballots)
}
