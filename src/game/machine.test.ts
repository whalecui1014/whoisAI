import { describe, expect, it } from 'vitest'
import { PHASE_SECONDS } from './data'
import { createGame, gameReducer } from './machine'

describe('game state machine', () => {
  it('keeps each simultaneous-public stage separate and totals the PRD 345 seconds', () => {
    let state = createGame(0, 'round1Write')
    state = gameReducer(state, { type: 'DRAFT', round: 1, value: '建议结合预算和通勤时间综合判断。' })
    state = gameReducer(state, { type: 'SUBMIT', round: 1 })
    state = gameReducer(state, { type: 'ADVANCE', from: 'round1Write' })
    expect(state.phase).toBe('round1Public')
    expect(Object.keys(state.submissions[1])).toHaveLength(4)
    state = gameReducer(state, { type: 'ADVANCE', from: 'round1Write' })
    expect(state.phase).toBe('round1Public')
    state = gameReducer(state, { type: 'ADVANCE', from: 'round1Public' })
    expect(state.phase).toBe('round1Vote')
    const total = Object.entries(PHASE_SECONDS)
      .filter(([phase]) => phase !== 'landing' && phase !== 'lobby')
      .reduce((sum, [, seconds]) => sum + seconds, 0)
    expect(total).toBe(345)
  })

  it('keeps round-three quality and final identity selections independent', () => {
    let state = createGame(0, 'round3QualityVote')
    state = gameReducer(state, { type: 'SELECT', ballot: 'round3Quality', seat: 'C' })
    state = gameReducer(state, { type: 'LOCK_VOTE', ballot: 'round3Quality' })
    state = gameReducer(state, { type: 'ADVANCE', from: 'round3QualityVote' })
    expect(state.phase).toBe('finalIdentityVote')
    expect(state.ballots.round3Quality.A).toBe('C')
    expect(state.selections.finalIdentity).toBeUndefined()
    expect(state.ballots.finalIdentity.A).toBeUndefined()
  })

  it('rejects self-voting and locks a confirmed vote', () => {
    let state = createGame(0, 'round1Vote')
    state = gameReducer(state, { type: 'SELECT', ballot: 'round1Identity', seat: 'A' })
    expect(state.selections.round1Identity).toBeUndefined()
    expect(state.notice).toContain('不能')
    state = gameReducer(state, { type: 'SELECT', ballot: 'round1Identity', seat: 'D' })
    state = gameReducer(state, { type: 'LOCK_VOTE', ballot: 'round1Identity' })
    const locked = state.ballots.round1Identity.A
    state = gameReducer(state, { type: 'SELECT', ballot: 'round1Identity', seat: 'B' })
    expect(locked).toBe('D')
    expect(state.ballots.round1Identity.A).toBe('D')
  })

  it('creates a new game id and clears the new user actions on rematch', () => {
    let state = createGame(0, 'settlement')
    state.selections = { round1Identity: 'D', round3Quality: 'C' }
    const oldGameId = state.gameId
    state = gameReducer(state, { type: 'REMATCH' })
    expect(state.gameId).not.toBe(oldGameId)
    expect(state.phase).toBe('lobby')
    expect(state.rematchIndex).toBe(1)
    expect(state.selections).toEqual({})
    expect(state.ballots.round1Identity[state.userSeat]).toBeUndefined()
    expect(state.ballots.round3Quality[state.userSeat]).toBeUndefined()
  })
})
