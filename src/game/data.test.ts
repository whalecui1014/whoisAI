import { describe, expect, it } from 'vitest'
import { countVisibleCharacters } from './graphemes'
import { POST, SCRIPTED_SUBMISSIONS, SEATS } from './data'

describe('主推题包', () => {
  it('明确标记为游戏示例', () => {
    expect(POST.sourceType).toBe('游戏示例')
    expect(POST.sourceDescription).toContain('不对应真实作者')
  })

  it('所有预设内容都不超过 50 个用户可见字符', () => {
    for (const round of [1, 2, 3] as const) {
      for (const seat of SEATS) {
        expect(countVisibleCharacters(SCRIPTED_SUBMISSIONS[round][seat])).toBeLessThanOrEqual(50)
      }
    }
  })

  it('第三轮每个预设内容只问一个问题', () => {
    for (const seat of SEATS) {
      const submission = SCRIPTED_SUBMISSIONS[3][seat]
      expect(submission.endsWith('？')).toBe(true)
      expect(submission.match(/？/g)).toHaveLength(1)
    }
  })
})
