import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateGameContent } from './ai'
import type { InitialPost } from './posts'

const post: InitialPost = {
  id: 'zhihu-answer-1', title: '咖啡为什么会让人感到放松？', text: '对我来说，慢慢喝咖啡的过程比咖啡因更重要。',
  textKind: 'excerpt', sourceUrl: 'https://www.zhihu.com/answer/1', author: null, commentCount: null, voteCount: null, readingSeconds: 20, category: 'opinion',
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('AI game content client', () => {
  it('accepts bounded generated content', async () => {
    vi.stubEnv('VITE_AI_API_KEY', 'test-key')
    vi.stubEnv('VITE_AI_MODEL', 'test-model')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
      scenario: '如果这杯咖啡是在凌晨加班后喝到的。',
      round1: '建议综合考虑风味与情绪价值。', round2: '仪式感有时比提神更让人放松。', round3: '那一口咖啡让你暂时放下了什么？',
    }) } }] }), { status: 200 })))
    await expect(generateGameContent(post)).resolves.toMatchObject({ scenario: expect.stringContaining('凌晨') })
  })

  it('rejects overlong model text', async () => {
    vi.stubEnv('VITE_AI_API_KEY', 'test-key')
    vi.stubEnv('VITE_AI_MODEL', 'test-model')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
      scenario: '一个具体情景', round1: '字'.repeat(51), round2: '正常评论', round3: '正常问题？',
    }) } }] }), { status: 200 })))
    await expect(generateGameContent(post)).rejects.toThrow('格式')
  })
})
