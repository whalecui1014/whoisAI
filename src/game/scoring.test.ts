import { describe, expect, it } from 'vitest'
import { calculateRoundScores, calculateScores } from './scoring'
import type { GameBallots, RoundSlots, SeatId } from './types'

function slots(orders: [SeatId[], SeatId[], SeatId[]]): RoundSlots {
  const make = (order: SeatId[]) => order.map((authorSeat, index) => ({ contentId: String(index + 1) as '1' | '2' | '3' | '4', authorSeat }))
  return { 1: make(orders[0]), 2: make(orders[1]), 3: make(orders[2]) }
}

const fixtureSlots = slots([
  ['B', 'A', 'C', 'D'],
  ['B', 'A', 'C', 'D'],
  ['A', 'B', 'C', 'D'],
])

const fixtureBallots: GameBallots = {
  1: { A: '3', B: '4', C: '4' },
  2: { A: '4', B: '3', C: '4' },
  3: { A: '4', B: '4', C: '2' },
}

describe('three-round human-only scoring', () => {
  it('reproduces the supplied fixture: A=4, B=7, C=10', () => {
    const scores = calculateScores('D', fixtureBallots, fixtureSlots)
    expect(Object.fromEntries(scores.map(score => [score.seat, score.total]))).toEqual({ C: 10, B: 7, A: 4 })
    expect(scores.map(score => [score.seat, score.rank])).toEqual([['C', 1], ['B', 2], ['A', 3]])
  })

  it('recalculates the result from the current user vote instead of fixing the fixture winner', () => {
    const changed: GameBallots = { ...fixtureBallots, 1: { ...fixtureBallots[1], A: '4' } }
    const totals = Object.fromEntries(calculateScores('D', changed, fixtureSlots).map(score => [score.seat, score.total]))
    expect(totals).toEqual({ B: 7, C: 7, A: 6 })
  })

  it('awards only +2 when every human finds AI and no human is misidentified', () => {
    const fixedSlots = slots([['A', 'B', 'C', 'D'], ['A', 'B', 'C', 'D'], ['A', 'B', 'C', 'D']])
    const ballots: GameBallots = { 1: { A: '4', B: '4', C: '4' }, 2: {}, 3: {} }
    const round = calculateRoundScores(1, 'D', ballots, fixedSlots)
    expect(['A', 'B', 'C'].map(seat => round[seat as SeatId].total)).toEqual([2, 2, 2])
    expect(['A', 'B', 'C'].every(seat => round[seat as SeatId].topMisidentified === 0)).toBe(true)
  })

  it('awards every human tied at a positive highest misidentification count', () => {
    const fixedSlots = slots([['A', 'B', 'C', 'D'], ['A', 'B', 'C', 'D'], ['A', 'B', 'C', 'D']])
    const ballots: GameBallots = { 1: { A: '2', B: '1', C: '4' }, 2: {}, 3: {} }
    const round = calculateRoundScores(1, 'D', ballots, fixedSlots)
    expect(round.A).toMatchObject({ topMisidentified: 3, total: 3 })
    expect(round.B).toMatchObject({ topMisidentified: 3, total: 3 })
    expect(round.C).toMatchObject({ correctGuess: 2, total: 2 })
    const scores = calculateScores('D', ballots, fixedSlots)
    expect(scores.map(score => [score.seat, score.rank])).toEqual([['A', 1], ['B', 1], ['C', 3]])
  })

  it('ignores an unexpected AI ballot', () => {
    const withAiVote: GameBallots = { ...fixtureBallots, 1: { ...fixtureBallots[1], D: '1' } }
    expect(calculateScores('D', withAiVote, fixtureSlots)).toEqual(calculateScores('D', fixtureBallots, fixtureSlots))
  })

  it('allows 15 points only by earning both components in all three rounds', () => {
    const fixedSlots = slots([['A', 'B', 'C', 'D'], ['A', 'B', 'C', 'D'], ['A', 'B', 'C', 'D']])
    const ballots: GameBallots = {
      1: { A: '4', B: '1', C: '1' },
      2: { A: '4', B: '1', C: '1' },
      3: { A: '4', B: '1', C: '1' },
    }
    expect(calculateScores('D', ballots, fixedSlots).find(score => score.seat === 'A')?.total).toBe(15)
  })

  it('is pure and returns the same result when calculated again', () => {
    expect(calculateScores('D', fixtureBallots, fixtureSlots)).toEqual(calculateScores('D', fixtureBallots, fixtureSlots))
  })
})
