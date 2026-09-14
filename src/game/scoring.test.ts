import { describe, expect, it } from 'vitest'
import { SAMPLE_SCRIPTED_BALLOTS } from './data'
import { calculateScores } from './scoring'
import type { GameBallots } from './types'

describe('human-only scoring', () => {
  it('reproduces the PRD section 9 example: A=11, B=7, C=4', () => {
    const scores = calculateScores('D', SAMPLE_SCRIPTED_BALLOTS)
    expect(Object.fromEntries(scores.map(score => [score.seat, score.total]))).toEqual({ A: 11, B: 7, C: 4 })
  })

  it('reaches 15 only from the two other humans and ignores the AI ballot', () => {
    const ballots: GameBallots = {
      round1Identity: { A: 'D', B: 'A', C: 'A', D: 'A' },
      round2Quality: { A: 'B', B: 'A', C: 'A', D: 'A' },
      round3Quality: { A: 'C', B: 'A', C: 'A', D: 'A' },
      finalIdentity: { A: 'D', B: 'D', C: 'D', D: 'A' },
    }
    const scoreA = calculateScores('D', ballots).find(score => score.seat === 'A')
    expect(scoreA).toMatchObject({ masquerade: 2, firstDetect: 2, comment: 4, question: 4, finalDetect: 3, total: 15 })
  })
})
