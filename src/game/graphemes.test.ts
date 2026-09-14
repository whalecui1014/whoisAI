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

  it('applies the third-round 30-character limit independently', () => {
    expect(validateSubmission('问'.repeat(30), 30)).toBeNull()
    expect(validateSubmission('问'.repeat(31), 30)).toContain('超过 30')
  })

  it('rejects whitespace-only input', () => {
    expect(validateSubmission('  \n\t')).toContain('先写点什么')
  })

  it('counts a family emoji as one visible character', () => {
    expect(countVisibleCharacters('👨‍👩‍👧‍👦')).toBe(1)
    expect(countVisibleCharacters('A👨‍👩‍👧‍👦中')).toBe(3)
  })
})
