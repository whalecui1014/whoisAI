import { beforeEach, describe, expect, it } from 'vitest'
import { createGame } from './machine'
import { setPostCatalog } from './posts'
import { isGameState } from './storage'

beforeEach(() => setPostCatalog({ schemaVersion: 1, posts: [
  { id: 'zhihu-answer-1', title: '测试问题一', text: '我认为这是一个可以讨论的完整回答，因为它包含简单明确的理由。', textKind: 'excerpt', sourceUrl: 'https://www.zhihu.com/answer/1', author: null, commentCount: null, voteCount: null, readingSeconds: 30, category: 'opinion' },
  { id: 'zhihu-answer-2', title: '测试问题二', text: '我认为这也是一个可以讨论的回答，因为它给出了不同但容易理解的理由。', textKind: 'excerpt', sourceUrl: 'https://www.zhihu.com/answer/2', author: null, commentCount: null, voteCount: null, readingSeconds: 30, category: 'opinion' },
] }))

describe('persisted-state validation', () => {
  it('accepts a complete game state', () => {
    expect(isGameState(createGame())).toBe(true)
  })

  it('rejects same-version partial or structurally invalid data', () => {
    expect(isGameState({ version: 2, phase: 'lobby' })).toBe(false)
    expect(isGameState({ ...createGame(), userSeat: 'Z' })).toBe(false)
    expect(isGameState({ ...createGame(), ballots: { round1Identity: { A: 'A' } } })).toBe(false)
    expect(isGameState({ ...createGame(), aiContentStatus: 'done' })).toBe(false)
  })
})
