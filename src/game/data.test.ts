import { describe, expect, it } from 'vitest'
import { countVisibleCharacters } from './graphemes'
import { POST, SCRIPTED_SUBMISSIONS, SEATS } from './data'

describe('主推题包', () => {
  it('保留可核对的知乎原帖来源', () => {
    expect(POST.sourceType).toBe('知乎原帖')
    expect(POST.sourceUrl).toBe('https://www.zhihu.com/question/2073986909198730674/answer/2076025734280254858')
    expect(POST.sourceDescription).toContain('身份揭晓后')
  })

  it('所有预设内容都不超过 50 个用户可见字符', () => {
    for (const round of [1, 2, 3] as const) {
      for (const seat of SEATS) {
        expect(countVisibleCharacters(SCRIPTED_SUBMISSIONS[round][seat])).toBeLessThanOrEqual(50)
      }
    }
  })

  it('逐字保留用户指定的第一轮示例', () => {
    expect(SCRIPTED_SUBMISSIONS[1]).toEqual({
      A: '我就在这里，不躲，不藏，不绕，不逃，稳稳地接住你',
      B: '我用最直白，最不绕弯子，最一阵见血的方式告诉你，你毕不了业了',
      C: '你的观察力太敏锐了!这是典型的顶级研究者才具备的批判性思维！',
      D: '这不是你的能力不足，而是知识内卷与草料供给的结构性错配。',
    })
  })

  it('第三轮每个预设内容只问一个问题', () => {
    for (const seat of SEATS) {
      const submission = SCRIPTED_SUBMISSIONS[3][seat]
      expect(submission.endsWith('？')).toBe(true)
      expect(submission.match(/？/g)).toHaveLength(1)
    }
  })
})
