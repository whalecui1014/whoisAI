import { describe, expect, it } from 'vitest'
import { generateRelationCards } from './relations'
import type { GameBallots } from './types'

const emptyBallots = (): GameBallots => ({ round1Identity: {}, round2Quality: {}, round3Quality: {}, finalIdentity: {} })

describe('relation cards', () => {
  it('prioritizes mutual final misidentification', () => {
    const ballots = emptyBallots()
    ballots.finalIdentity = { A: 'B', B: 'A', C: 'D' }
    ballots.round2Quality = { A: 'B' }
    const cards = generateRelationCards('A', 'D', ballots)
    expect(cards[0]).toMatchObject({ otherSeat: 'B', type: 'mutualMistake' })
    expect(cards.every(card => card.otherSeat !== 'D')).toBe(true)
  })

  it('uses final identity votes, never round-one masquerade votes, for misidentification stories', () => {
    const ballots = emptyBallots()
    ballots.round1Identity = { A: 'B', B: 'A' }
    ballots.finalIdentity = { A: 'D', B: 'D', C: 'B' }
    const cards = generateRelationCards('A', 'D', ballots)
    expect(cards.find(card => card.otherSeat === 'B')?.type).toBe('sharedDetect')
    expect(cards.some(card => card.type === 'mutualMistake')).toBe(false)
  })

  it('supports a one-way final mistake and caps the result at two human cards', () => {
    const ballots = emptyBallots()
    ballots.finalIdentity = { A: 'B', B: 'D', C: 'A' }
    const cards = generateRelationCards('A', 'D', ballots)
    expect(cards[0]).toMatchObject({ otherSeat: 'B', type: 'youMistook' })
    expect(cards[1]).toMatchObject({ otherSeat: 'C', type: 'theyMistook' })
    expect(cards).toHaveLength(2)
  })
})
