import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateGameContent } from './ai'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('AI game content client', () => {
  it('uses bounded preset content when no model is configured', async () => {
    vi.stubEnv('VITE_AI_MODEL', '')
    await expect(generateGameContent()).resolves.toMatchObject({ source: 'preset' })
  })

  it('accepts model content for the three fixed topics', async () => {
    vi.stubEnv('VITE_AI_MODEL', 'test-model')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
      round1: '仅从题面判断，实际通过原因仍需看申报材料。',
      round2: 'duo 在拉丁语里表示“二”，英语中也可指二人组合。',
      round3: '取经算不算最早的出差团建？',
    }) } }] }), { status: 200 })))
    await expect(generateGameContent()).resolves.toMatchObject({ source: 'model', submissions: { 3: expect.stringContaining('取经') } })
  })

  it('rejects a model question over the 30-character third-round limit', async () => {
    vi.stubEnv('VITE_AI_MODEL', 'test-model')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
      round1: '正常评论', round2: '正常解释', round3: '问'.repeat(31),
    }) } }] }), { status: 200 })))
    await expect(generateGameContent()).rejects.toThrow('50/50/30')
  })
})
