import { describe, expect, it } from 'vitest'
import { countVisibleCharacters } from './graphemes'
import { PRESET_AI_SUBMISSIONS, ROUNDS, ROUND_TOPICS, SCRIPTED_SUBMISSIONS, SEATS } from './data'

describe('三轮题目与预设内容', () => {
  it('使用三道独立题目与 50/50/30 字限制', () => {
    expect(ROUND_TOPICS[1].title).toBe('为什么《牛来》能申请到龙标？')
    expect(ROUND_TOPICS[2].title).toBe('iPhone duo 的 duo 有什么含义？')
    expect(ROUND_TOPICS[3].title).toBe('#西游记')
    expect(ROUNDS.map(round => ROUND_TOPICS[round].maxChars)).toEqual([50, 50, 30])
  })

  it('所有预设内容都遵守对应轮次上限', () => {
    for (const round of ROUNDS) {
      for (const seat of SEATS) {
        expect(countVisibleCharacters(SCRIPTED_SUBMISSIONS[round][seat])).toBeLessThanOrEqual(ROUND_TOPICS[round].maxChars)
        expect(SCRIPTED_SUBMISSIONS[round][seat].trim()).not.toBe('')
      }
      expect(countVisibleCharacters(PRESET_AI_SUBMISSIONS[round])).toBeLessThanOrEqual(ROUND_TOPICS[round].maxChars)
    }
  })

  it('保留参考模拟中三种有区分度的写法', () => {
    expect(SCRIPTED_SUBMISSIONS[1].B).toContain('审核员')
    expect(SCRIPTED_SUBMISSIONS[2].C).toContain('拉丁语')
    expect(PRESET_AI_SUBMISSIONS[3]).toContain('职场团建')
  })

  it('题目配置不包含虚构的原帖链接', () => {
    expect(ROUNDS.every(round => !('sourceUrl' in ROUND_TOPICS[round]))).toBe(true)
  })
})
