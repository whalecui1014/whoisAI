import { describe, expect, it } from 'vitest'
import { PHASE_ORDER, PHASE_SECONDS } from './data'
import { createGame, gameReducer } from './machine'

describe('game state machine', () => {
  it('moves from writing straight to a 40-second vote when the shared clock ends', () => {
    let state = createGame(0, 'round1Write')
    state = gameReducer(state, { type: 'DRAFT', round: 1, value: '建议综合考虑同行关系、旅行节奏与预订成本。' })
    state = gameReducer(state, { type: 'SUBMIT', round: 1 })
    expect(state.phase).toBe('round1Write')
    expect(Object.keys(state.submissions[1])).toHaveLength(4)

    state = { ...state, secondsLeft: 1 }
    state = gameReducer(state, { type: 'TICK' })
    expect(state.phase).toBe('round1Vote')
    expect(state.secondsLeft).toBe(40)
    expect(PHASE_ORDER.some(phase => phase.toLowerCase().includes('public'))).toBe(false)

    const total = Object.entries(PHASE_SECONDS)
      .filter(([phase]) => phase !== 'landing' && phase !== 'lobby')
      .reduce((sum, [, seconds]) => sum + seconds, 0)
    expect(total).toBe(345)
  })

  it('keeps round-three quality and final identity votes independent', () => {
    let state = createGame(0, 'round3QualityVote')
    state = gameReducer(state, { type: 'CAST_VOTE', ballot: 'round3Quality', seat: 'C' })
    state = { ...state, secondsLeft: 1 }
    state = gameReducer(state, { type: 'TICK' })
    expect(state.phase).toBe('finalIdentityVote')
    expect(state.ballots.round3Quality.A).toBe('C')
    expect(state.ballots.finalIdentity.A).toBeUndefined()

    state = gameReducer(state, { type: 'CAST_VOTE', ballot: 'finalIdentity', seat: 'B' })
    expect(state.ballots.round3Quality.A).toBe('C')
    expect(state.ballots.finalIdentity.A).toBe('B')
  })

  it('rejects self-voting and locks the first accepted vote', () => {
    let state = createGame(0, 'round1Vote')
    state = gameReducer(state, { type: 'CAST_VOTE', ballot: 'round1Identity', seat: 'A' })
    expect(state.ballots.round1Identity.A).toBeUndefined()
    expect(state.notice).toContain('不能')

    state = gameReducer(state, { type: 'CAST_VOTE', ballot: 'round1Identity', seat: 'D' })
    state = gameReducer(state, { type: 'CAST_VOTE', ballot: 'round1Identity', seat: 'B' })
    expect(state.ballots.round1Identity.A).toBe('D')
  })

  it('does not advance early after a vote and advances when the shared clock ends', () => {
    let state = createGame(0, 'round1Vote')
    state = gameReducer(state, { type: 'CAST_VOTE', ballot: 'round1Identity', seat: 'D' })
    state = gameReducer(state, { type: 'TICK' })
    expect(state.phase).toBe('round1Vote')
    expect(state.secondsLeft).toBe(39)

    state = { ...state, secondsLeft: 1 }
    state = gameReducer(state, { type: 'TICK' })
    expect(state.phase).toBe('round2Write')
  })

  it('uses the grace period and invalidates an unfinished phase', () => {
    let state = { ...createGame(0, 'round2Vote'), secondsLeft: 1 }
    state = gameReducer(state, { type: 'TICK' })
    expect(state.phase).toBe('round2Vote')
    expect(state.secondsLeft).toBe(10)
    expect(state.graceUsed).toBe(true)

    state = { ...state, secondsLeft: 1 }
    state = gameReducer(state, { type: 'TICK' })
    expect(state.phase).toBe('settlement')
    expect(state.gameValid).toBe(false)
  })

  it('creates a new game id and clears user actions on rematch', () => {
    let state = createGame(0, 'settlement')
    state.ballots.round1Identity[state.userSeat] = 'D'
    state.ballots.round3Quality[state.userSeat] = 'C'
    const oldGameId = state.gameId
    state = gameReducer(state, { type: 'REMATCH' })
    expect(state.gameId).not.toBe(oldGameId)
    expect(state.phase).toBe('lobby')
    expect(state.rematchIndex).toBe(1)
    expect(state.ballots.round1Identity[state.userSeat]).toBeUndefined()
    expect(state.ballots.round3Quality[state.userSeat]).toBeUndefined()
  })
})
