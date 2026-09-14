import { PHASE_SECONDS, SAMPLE_SCRIPTED_BALLOTS, SCRIPTED_SUBMISSIONS } from './data'
import { validateSubmission } from './graphemes'
import { pickPost, type InitialPost } from './posts'
import type { BallotType, GamePhase, GameState, GeneratedGameContent, OutfitId, RoundNumber, SeatId } from './types'

export type GameAction =
  | { type: 'START' }
  | { type: 'READY' }
  | { type: 'PHASE_EXPIRED'; from: GamePhase }
  | { type: 'SHOW_SETTLEMENT' }
  | { type: 'AI_CONTENT_REQUEST' }
  | { type: 'AI_CONTENT_SUCCESS'; gameId: string; content: GeneratedGameContent }
  | { type: 'AI_CONTENT_FAILURE'; gameId: string; message: string }
  | { type: 'AI_CONTENT_RETRY' }
  | { type: 'DRAFT'; round: RoundNumber; value: string }
  | { type: 'SUBMIT'; round: RoundNumber }
  | { type: 'CAST_VOTE'; ballot: BallotType; seat: SeatId }
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
const phaseByBallot: Record<BallotType, GamePhase> = { round1Identity: 'round1Vote', round2Quality: 'round2Vote', round3Quality: 'round3QualityVote', finalIdentity: 'finalIdentityVote' }

function newId(index: number) {
  return `game-${Date.now().toString(36)}-${index}`
}

export function createGame(rematchIndex = 0, phase: GamePhase = 'landing', post: InitialPost = pickPost(), seenPostIds: string[] = [post.id]): GameState {
  const layout = layouts[rematchIndex % layouts.length]
  const submissions = {
    1: { ...SCRIPTED_SUBMISSIONS[1] },
    2: { ...SCRIPTED_SUBMISSIONS[2] },
    3: { ...SCRIPTED_SUBMISSIONS[3] },
  }
  delete submissions[1][layout.userSeat]
  delete submissions[2][layout.userSeat]
  delete submissions[3][layout.userSeat]
  delete submissions[1][layout.aiSeat]
  delete submissions[2][layout.aiSeat]
  delete submissions[3][layout.aiSeat]

  const ballots = {
    round1Identity: { ...SAMPLE_SCRIPTED_BALLOTS.round1Identity },
    round2Quality: { ...SAMPLE_SCRIPTED_BALLOTS.round2Quality },
    round3Quality: { ...SAMPLE_SCRIPTED_BALLOTS.round3Quality },
    finalIdentity: { ...SAMPLE_SCRIPTED_BALLOTS.finalIdentity },
  }
  delete ballots.round1Identity[layout.userSeat]
  delete ballots.round2Quality[layout.userSeat]
  delete ballots.round3Quality[layout.userSeat]
  delete ballots.finalIdentity[layout.userSeat]

  return {
    version: 2,
    gameId: newId(rematchIndex),
    post: structuredClone(post),
    seenPostIds: [...seenPostIds],
    scenario: '',
    aiContentStatus: 'idle',
    rematchIndex,
    phase,
    userSeat: layout.userSeat,
    aiSeat: layout.aiSeat,
    outfitBySeat: layout.outfits,
    submissions,
    drafts: { 1: '', 2: '', 3: '' },
    ballots,
    paused: false,
    speed: 1,
    secondsLeft: PHASE_SECONDS[phase],
    graceUsed: false,
    gameValid: true,
    settled: false,
  }
}

function requiredActionComplete(state: GameState): boolean {
  const user = state.userSeat
  if (state.phase === 'round1Write') return Boolean(state.submissions[1][user])
  if (state.phase === 'round2Write') return Boolean(state.submissions[2][user])
  if (state.phase === 'round3Write') return Boolean(state.submissions[3][user])
  if (state.phase === 'round1Vote') return Boolean(state.ballots.round1Identity[user])
  if (state.phase === 'round2Vote') return Boolean(state.ballots.round2Quality[user])
  if (state.phase === 'round3QualityVote') return Boolean(state.ballots.round3Quality[user])
  if (state.phase === 'finalIdentityVote') return Boolean(state.ballots.finalIdentity[user])
  return true
}

function missingActionMessage(state: GameState): string {
  if (state.phase === 'round1Write' || state.phase === 'round2Write' || state.phase === 'round3Write') return '请先提交本轮内容。'
  if (state.phase === 'round1Vote' || state.phase === 'round2Vote' || state.phase === 'round3QualityVote' || state.phase === 'finalIdentityVote') return '请先投票。'
  return '请先完成当前操作。'
}

function nextPhase(phase: GamePhase): GamePhase {
  const map: Partial<Record<GamePhase, GamePhase>> = {
    reading: 'round1Write', round1Write: 'round1Vote', round1Vote: 'round2Write', round2Write: 'round2Vote', round2Vote: 'round3Write', round3Write: 'round3QualityVote', round3QualityVote: 'finalIdentityVote', finalIdentityVote: 'reveal', reveal: 'settlement',
  }
  return map[phase] ?? phase
}

function move(state: GameState, phase: GamePhase): GameState {
  return { ...state, phase, secondsLeft: phase === 'reading' ? Math.max(PHASE_SECONDS.reading, state.post.readingSeconds) : PHASE_SECONDS[phase], graceUsed: false, notice: undefined, settled: phase === 'settlement' ? true : state.settled }
}

function expirePhase(state: GameState): GameState {
  if (state.phase === 'landing' || state.phase === 'lobby' || state.phase === 'settlement') return state
  if (state.phase === 'reveal') return { ...state, secondsLeft: 0 }
  if (requiredActionComplete(state)) return move(state, nextPhase(state.phase))
  if (!state.graceUsed) return { ...state, secondsLeft: 10, graceUsed: true, notice: '还有人没完成，再等 10 秒。' }
  return { ...state, secondsLeft: 0, gameValid: false, invalidReason: '加时结束后，仍有人没完成提交或投票，这局不计分。', phase: 'settlement', settled: true }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START': return state.phase === 'landing' ? move(createGame(0, 'lobby', state.post, state.seenPostIds), 'lobby') : state
    case 'READY': return state.phase === 'lobby' && state.aiContentStatus === 'ready' ? move(state, 'reading') : state
    case 'AI_CONTENT_REQUEST': return state.phase === 'lobby' && state.aiContentStatus === 'idle'
      ? { ...state, aiContentStatus: 'loading', aiContentError: undefined }
      : state
    case 'AI_CONTENT_SUCCESS': {
      if (state.phase !== 'lobby' || state.gameId !== action.gameId || state.aiContentStatus !== 'loading') return state
      const submissions = { ...state.submissions }
      for (const round of [1, 2, 3] as RoundNumber[]) submissions[round] = { ...submissions[round], [state.aiSeat]: action.content.submissions[round] }
      return { ...state, scenario: action.content.scenario, submissions, aiContentStatus: 'ready', aiContentError: undefined }
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
      const error = validateSubmission(state.drafts[action.round])
      if (error) return { ...state, notice: error }
      return { ...state, submissions: { ...state.submissions, [action.round]: { ...state.submissions[action.round], [state.userSeat]: state.drafts[action.round] } }, notice: undefined }
    }
    case 'CAST_VOTE': {
      if (state.phase !== phaseByBallot[action.ballot]) return state
      if (action.seat === state.userSeat) return { ...state, notice: '不能投自己哦。' }
      if (state.ballots[action.ballot][state.userSeat]) return state
      return { ...state, ballots: { ...state.ballots, [action.ballot]: { ...state.ballots[action.ballot], [state.userSeat]: action.seat } }, notice: undefined }
    }
    case 'PHASE_EXPIRED': {
      if (state.phase !== action.from) return state
      if (!requiredActionComplete(state)) return { ...state, notice: missingActionMessage(state) }
      return expirePhase({ ...state, secondsLeft: 0 })
    }
    case 'SHOW_SETTLEMENT': return state.phase === 'reveal' ? move(state, 'settlement') : state
    case 'TOGGLE_PAUSE': return { ...state, paused: !state.paused }
    case 'TOGGLE_SPEED': return { ...state, speed: state.speed === 1 ? 5 : 1 }
    case 'TICK': {
      if (state.paused || state.secondsLeft <= 0 || state.phase === 'landing' || state.phase === 'lobby' || state.phase === 'settlement') return state
      const next = Math.max(0, state.secondsLeft - state.speed)
      if (next > 0) return { ...state, secondsLeft: next }
      return expirePhase({ ...state, secondsLeft: 0 })
    }
    case 'RESET': return createGame(0, 'landing')
    case 'REMATCH': {
      if (state.phase !== 'settlement') return state
      const post = pickPost(state.seenPostIds)
      const seenPostIds = state.seenPostIds.includes(post.id) ? [post.id] : [...state.seenPostIds, post.id]
      return move(createGame(state.rematchIndex + 1, 'lobby', post, seenPostIds), 'lobby')
    }
    case 'CLEAR_NOTICE': return { ...state, notice: undefined }
    default: return state
  }
}

export function completeBallots(state: GameState) {
  return structuredClone(state.ballots)
}
