import { describe, expect, it } from 'vitest'
import { countVisibleCharacters, validateSubmission } from './graphemes'

describe('visible-character validation', () => {
  it('accepts 50 graphemes and rejects 51 without truncating', () => {
    const fifty = '知'.repeat(50)
    const fiftyOne = `${fifty}乎`
    expect(countVisibleCharacters(fifty)).toBe(50)
    expect(validateSubmission(fifty)).toBeNull()
    expect(countVisibleCharacters(fiftyOne)).toBe(51)
    expect(validateSubmission(fiftyOne)).toContain('超过 50')
    expect(fiftyOne).toHaveLength(51)
  })

  it('rejects whitespace-only input', () => {
    expect(validateSubmission('  \n\t')).toContain('不能为空')
  })

  it('counts a family emoji as one visible character', () => {
    expect(countVisibleCharacters('👨‍👩‍👧‍👦')).toBe(1)
    expect(countVisibleCharacters('A👨‍👩‍👧‍👦中')).toBe(3)
  })
})
