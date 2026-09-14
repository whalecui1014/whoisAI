import { describe, expect, it } from 'vitest'
import { generateRelationCards } from './relations'

describe('relation cards', () => {
  it('keeps the obsolete cross-round relationship entry hidden', () => {
    expect(generateRelationCards()).toEqual([])
  })
})
