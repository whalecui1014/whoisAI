import { afterEach, describe, expect, it, vi } from 'vitest'
import { FALLBACK_POST, isInitialPost, loadPostCatalog, pickPost, setPostCatalog, type InitialPost } from './posts'
import { createGame, gameReducer } from './machine'
import { loadGame, saveGame } from './storage'

const post = (id: string): InitialPost => ({ ...FALLBACK_POST, id, sourceUrl: `https://www.zhihu.com/answer/${id}`, textKind: 'excerpt', author: '测试作者', readingSeconds: 60 })
afterEach(() => { setPostCatalog(null); vi.unstubAllGlobals() })

describe('imported initial posts', () => {
  it('validates schema, URLs and length without trusting an upstream time estimate', () => {
    expect(isInitialPost(FALLBACK_POST)).toBe(true)
    expect(isInitialPost(post('1'))).toBe(true)
    expect(isInitialPost({ ...post('1'), sourceUrl: 'javascript:alert(1)' })).toBe(false)
    expect(isInitialPost({ ...post('1'), text: '字'.repeat(301), readingSeconds: 1 })).toBe(false)
    setPostCatalog({ schemaVersion: 2, posts: [post('1')] })
    expect(pickPost().id).toBe(FALLBACK_POST.id)
  })

  it('keeps the preview in the game; rematch changes posts if available', () => {
    setPostCatalog({ schemaVersion: 1, posts: [post('1'), post('2')] })
    const landing = createGame()
    let state = gameReducer(landing, { type: 'START' })
    expect(state.post).toEqual(landing.post)
    state = gameReducer(state, { type: 'READY' })
    expect(state.secondsLeft).toBe(60)
    expect(state.post).toEqual(landing.post)
    const next = gameReducer({ ...state, phase: 'settlement' }, { type: 'REMATCH' })
    expect(next.post.id).not.toBe(state.post.id)
  })

  it('restores the exact active post even if the catalog changes, and migrates old saves', () => {
    const data = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) })
    const state = createGame(0, 'reading', post('1'))
    expect(saveGame(state)).toBe(true)
    setPostCatalog({ schemaVersion: 1, posts: [post('2')] })
    expect(loadGame().post).toEqual(state.post)
    const legacy = { ...state } as Partial<typeof state>
    delete legacy.post
    for (const key of data.keys()) data.set(key, JSON.stringify(legacy))
    expect(loadGame().post).toEqual(FALLBACK_POST)
    expect(loadGame().phase).toBe('reading')
  })

  it('falls back on missing or malformed catalogs and loads a valid one', async () => {
    await loadPostCatalog(vi.fn().mockResolvedValue(new Response(JSON.stringify({ schemaVersion: 1, posts: [post('1')] }))))
    expect(pickPost().id).toBe('1')
    await loadPostCatalog(vi.fn().mockRejectedValue(new Error('offline')))
    expect(pickPost()).toEqual(FALLBACK_POST)
    await loadPostCatalog(vi.fn().mockResolvedValue(new Response('<html>not json</html>')))
    expect(pickPost()).toEqual(FALLBACK_POST)
  })
})
