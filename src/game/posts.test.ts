import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isInitialPost, loadPostCatalog, pickPost, setPostCatalog, type InitialPost } from './posts'

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

  it('does not repeat until every post in the catalog has been used', () => {
    setPostCatalog({ schemaVersion: 1, posts: [post('1'), post('2'), post('3')] })
    const ids: string[] = []
    for (let index = 0; index < 3; index++) ids.push(pickPost(ids).id)
    expect(new Set(ids).size).toBe(3)
    expect(pickPost(ids).id).not.toBe(ids.at(-1))
  })

  it('rejects missing, malformed and single-item catalogs', async () => {
    expect(await loadPostCatalog(vi.fn().mockResolvedValue(new Response(JSON.stringify({ schemaVersion: 1, posts: [post('1')] }))))).toBe(0)
    expect(await loadPostCatalog(vi.fn().mockRejectedValue(new Error('offline')))).toBe(0)
    expect(await loadPostCatalog(vi.fn().mockResolvedValue(new Response('<html>not json</html>')))).toBe(0)
    expect(() => pickPost()).toThrow('至少需要两篇')
  })
})
