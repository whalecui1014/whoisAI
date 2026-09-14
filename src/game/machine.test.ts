import { describe, expect, it } from 'vitest'
import { PHASE_ORDER, PHASE_SECONDS, ROUNDS } from './data'
import { contentForAuthor, createGame, gameReducer } from './machine'

const aiContent = {
  source: 'preset' as const,
  submissions: { 1: '第一轮 AI 内容', 2: '第二轮 AI 内容', 3: '第三轮 AI 问题？' },
}

function readyGame() {
  let state = createGame(0, 'lobby')
  state = gameReducer(state, { type: 'AI_CONTENT_REQUEST' })
  state = gameReducer(state, { type: 'AI_CONTENT_SUCCESS', gameId: state.gameId, content: aiContent })
  return gameReducer(state, { type: 'READY' })
}

describe('game state machine', () => {
  it('opens each round on an untimed reading phase, then starts the full writing clock', () => {
    let state = readyGame()
    expect(state.phase).toBe('round1Read')
    expect(state.secondsLeft).toBe(0)
    expect(gameReducer(state, { type: 'TICK' })).toEqual(state)

    state = gameReducer(state, { type: 'START_WRITING', round: 1 })
    expect(state.phase).toBe('round1Write')
    expect(state.secondsLeft).toBe(120)

    state = gameReducer(state, { type: 'DRAFT', round: 1, value: '我自己写的第一轮评论。' })
    state = gameReducer(state, { type: 'SUBMIT', round: 1 })
    expect(state.submissions[1][state.userSeat]).toBe('我自己写的第一轮评论。')
    state = gameReducer({ ...state, secondsLeft: 1 }, { type: 'TICK' })
    expect(state.phase).toBe('round1Vote')
    expect(state.secondsLeft).toBe(40)

    const aiContentId = contentForAuthor(state.contentSlots[1], state.aiSeat)!
    state = gameReducer(state, { type: 'CAST_VOTE', round: 1, contentId: aiContentId })
    state = gameReducer({ ...state, secondsLeft: 1 }, { type: 'TICK' })
    expect(state.phase).toBe('round2Read')
    expect(state.secondsLeft).toBe(0)

    state = gameReducer(state, { type: 'START_WRITING', round: 2 })
    expect(state.phase).toBe('round2Write')
    expect(state.secondsLeft).toBe(120)

    state = gameReducer(state, { type: 'DRAFT', round: 2, value: '我自己写的第二轮评论。' })
    state = gameReducer(state, { type: 'SUBMIT', round: 2 })
    state = gameReducer({ ...state, secondsLeft: 1 }, { type: 'TICK' })
    state = gameReducer(state, { type: 'CAST_VOTE', round: 2, contentId: contentForAuthor(state.contentSlots[2], state.aiSeat)! })
    state = gameReducer({ ...state, secondsLeft: 1 }, { type: 'TICK' })
    expect(state.phase).toBe('round3Read')
    expect(state.secondsLeft).toBe(0)

    state = gameReducer(state, { type: 'START_WRITING', round: 3 })
    expect(state.phase).toBe('round3Write')
    expect(state.secondsLeft).toBe(120)
    state = gameReducer(state, { type: 'DRAFT', round: 3, value: '我自己写的第三轮问题？' })
    state = gameReducer(state, { type: 'SUBMIT', round: 3 })
    state = gameReducer({ ...state, secondsLeft: 1 }, { type: 'TICK' })
    state = gameReducer(state, { type: 'CAST_VOTE', round: 3, contentId: contentForAuthor(state.contentSlots[3], state.aiSeat)! })
    state = gameReducer({ ...state, secondsLeft: 1 }, { type: 'TICK' })
    expect(state.phase).toBe('settlement')
  })

  it('only starts writing for the round that is currently being read', () => {
    const state = readyGame()
    expect(gameReducer(state, { type: 'START_WRITING', round: 2 })).toEqual(state)
    expect(gameReducer(state, { type: 'START_WRITING', round: 3 })).toEqual(state)

    const writing = gameReducer(state, { type: 'START_WRITING', round: 1 })
    expect(writing.phase).toBe('round1Write')
    expect(gameReducer(writing, { type: 'START_WRITING', round: 1 })).toEqual(writing)
  })

  it('uses untimed reading and 120/40 writing/voting with no intermediate reveal phase', () => {
    expect(PHASE_SECONDS.round1Read).toBe(0)
    expect(PHASE_SECONDS.round2Read).toBe(0)
    expect(PHASE_SECONDS.round3Read).toBe(0)
    expect(PHASE_SECONDS.round1Write).toBe(120)
    expect(PHASE_SECONDS.round2Write).toBe(120)
    expect(PHASE_SECONDS.round3Write).toBe(120)
    expect(PHASE_SECONDS.round1Vote).toBe(40)
    expect(PHASE_SECONDS.round2Vote).toBe(40)
    expect(PHASE_SECONDS.round3Vote).toBe(40)
    expect(Object.keys(PHASE_SECONDS).filter(phase => phase.endsWith('Vote'))).toHaveLength(3)
    expect(PHASE_ORDER.some(phase => phase.includes('Reveal'))).toBe(false)
  })

  it('blocks READY until AI content exists and ignores stale results', () => {
    let state = createGame(0, 'lobby')
    expect(gameReducer(state, { type: 'READY' }).phase).toBe('lobby')
    state = gameReducer(state, { type: 'AI_CONTENT_REQUEST' })
    const loading = state
    state = gameReducer(state, { type: 'AI_CONTENT_SUCCESS', gameId: 'stale-game', content: aiContent })
    expect(state).toEqual(loading)
    state = gameReducer(state, { type: 'AI_CONTENT_FAILURE', gameId: state.gameId, message: '上游失败' })
    expect(state.aiContentStatus).toBe('error')
    state = gameReducer(state, { type: 'AI_CONTENT_RETRY' })
    expect(state.aiContentStatus).toBe('idle')
  })

  it('rejects self-voting and locks the first accepted content id', () => {
    let state = createGame(0, 'round1Vote')
    const ownContentId = contentForAuthor(state.contentSlots[1], state.userSeat)!
    const aiContentId = contentForAuthor(state.contentSlots[1], state.aiSeat)!
    const otherContentId = state.contentSlots[1].find(slot => slot.authorSeat !== state.userSeat && slot.authorSeat !== state.aiSeat)!.contentId
    state = gameReducer(state, { type: 'CAST_VOTE', round: 1, contentId: ownContentId })
    expect(state.ballots[1][state.userSeat]).toBeUndefined()
    expect(state.notice).toContain('不能投自己')
    state = gameReducer(state, { type: 'CAST_VOTE', round: 1, contentId: aiContentId })
    state = gameReducer(state, { type: 'CAST_VOTE', round: 1, contentId: otherContentId })
    expect(state.ballots[1][state.userSeat]).toBe(aiContentId)
  })

  it('does not advance early after submit or vote', () => {
    let state = readyGame()
    state = gameReducer(state, { type: 'START_WRITING', round: 1 })
    state = gameReducer(state, { type: 'DRAFT', round: 1, value: '评论' })
    state = gameReducer(state, { type: 'SUBMIT', round: 1 })
    expect(state.phase).toBe('round1Write')
    state = gameReducer({ ...state, secondsLeft: 1 }, { type: 'TICK' })
    const target = state.contentSlots[1].find(slot => slot.authorSeat !== state.userSeat)!.contentId
    state = gameReducer(state, { type: 'CAST_VOTE', round: 1, contentId: target })
    expect(state.phase).toBe('round1Vote')
  })

  it('uses one grace period and invalidates an unfinished phase', () => {
    let state = { ...createGame(0, 'round2Vote'), secondsLeft: 1 }
    state = gameReducer(state, { type: 'TICK' })
    expect(state.phase).toBe('round2Vote')
    expect(state.secondsLeft).toBe(10)
    expect(state.graceUsed).toBe(true)
    state = gameReducer({ ...state, secondsLeft: 1 }, { type: 'TICK' })
    expect(state.phase).toBe('settlement')
    expect(state.gameValid).toBe(false)
  })

  it('creates a new game and clears all user actions on rematch', () => {
    let state = createGame(0, 'settlement')
    state.drafts[1] = '旧草稿'
    state.ballots[1][state.userSeat] = state.contentSlots[1].find(slot => slot.authorSeat !== state.userSeat)!.contentId
    const oldGameId = state.gameId
    state = gameReducer(state, { type: 'REMATCH' })
    expect(state.gameId).not.toBe(oldGameId)
    expect(state.phase).toBe('lobby')
    expect(state.rematchIndex).toBe(1)
    expect(ROUNDS.every(round => state.ballots[round][state.userSeat] === undefined)).toBe(true)
    expect(state.drafts).toEqual({ 1: '', 2: '', 3: '' })
    expect(state.aiContentStatus).toBe('idle')
  })
})
