import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isInitialPost, loadPostCatalog, pickPost, setPostCatalog, type InitialPost } from './posts'
import { createGame, gameReducer } from './machine'
import { loadGame, saveGame } from './storage'

const post = (id: string): InitialPost => ({
  id: `zhihu-answer-${id}`, title: '这是一个测试问题吗？',
  text: '我觉得答案值得讨论，因为这里给出了一个简单、完整而且普通人容易理解的理由。',
  textKind: 'excerpt', sourceUrl: `https://www.zhihu.com/answer/${id}`,
  author: '测试作者', commentCount: null, voteCount: null, readingSeconds: 60, category: 'opinion',
})

beforeEach(() => setPostCatalog({ schemaVersion: 1, posts: [post('1'), post('2')] }))
afterEach(() => { setPostCatalog(null); vi.unstubAllGlobals() })

describe('imported initial posts', () => {
  it('only accepts valid Zhihu posts and requires at least two', () => {
    expect(isInitialPost(post('1'))).toBe(true)
    expect(isInitialPost({ ...post('1'), sourceUrl: 'javascript:alert(1)' })).toBe(false)
    expect(isInitialPost({ ...post('1'), text: '字'.repeat(301), readingSeconds: 1 })).toBe(false)
    setPostCatalog({ schemaVersion: 1, posts: [post('1')] })
    expect(() => pickPost()).toThrow('至少需要两篇')
  })

  it('keeps the preview in the game and always changes the post on rematch', () => {
    const landing = createGame()
    let state = gameReducer(landing, { type: 'START' })
    expect(state.post).toEqual(landing.post)
    state = gameReducer(state, { type: 'AI_CONTENT_REQUEST' })
    state = gameReducer(state, { type: 'AI_CONTENT_SUCCESS', gameId: state.gameId, content: {
      scenario: '如果这个回答发生在一个特殊的周末。',
      submissions: { 1: '建议从多个维度综合考虑。', 2: '这个细节让我重新理解了回答。', 3: '那个周末最意外的变化是什么？' },
    } })
    state = gameReducer(state, { type: 'READY' })
    expect(state.secondsLeft).toBe(60)
    const next = gameReducer({ ...state, phase: 'settlement' }, { type: 'REMATCH' })
    expect(next.post.id).not.toBe(state.post.id)
  })

  it('does not repeat until every post in the catalog has been used', () => {
    setPostCatalog({ schemaVersion: 1, posts: [post('1'), post('2'), post('3')] })
    const ids: string[] = []
    for (let index = 0; index < 3; index++) ids.push(pickPost(ids).id)
    expect(new Set(ids).size).toBe(3)
    expect(pickPost(ids).id).not.toBe(ids.at(-1))
  })

  it('restores the exact active post even if the catalog changes', () => {
    const data = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) })
    const state = createGame(0, 'reading', post('1'))
    expect(saveGame(state)).toBe(true)
    setPostCatalog({ schemaVersion: 1, posts: [post('2'), post('3')] })
    expect(loadGame().post).toEqual(state.post)
  })

  it('rejects missing, malformed and single-item catalogs', async () => {
    expect(await loadPostCatalog(vi.fn().mockResolvedValue(new Response(JSON.stringify({ schemaVersion: 1, posts: [post('1')] }))))).toBe(0)
    expect(await loadPostCatalog(vi.fn().mockRejectedValue(new Error('offline')))).toBe(0)
    expect(await loadPostCatalog(vi.fn().mockResolvedValue(new Response('<html>not json</html>')))).toBe(0)
    expect(() => pickPost()).toThrow('至少需要两篇')
  })
})
