import { ROUNDS, SEATS } from './data'
import { authorForContent } from './machine'
import type { GameBallots, RoundNumber, RoundScoreBreakdown, RoundSlots, ScoreBreakdown, SeatId } from './types'

export function humanSeats(aiSeat: SeatId): SeatId[] {
  return SEATS.filter(seat => seat !== aiSeat)
}

export function calculateRoundScores(
  round: RoundNumber,
  aiSeat: SeatId,
  ballots: GameBallots,
  contentSlots: RoundSlots,
): Record<SeatId, RoundScoreBreakdown> {
  const humans = humanSeats(aiSeat)
  const validVotes = humans.flatMap(voter => {
    const contentId = ballots[round][voter]
    const authorSeat = contentId ? authorForContent(contentSlots[round], contentId) : undefined
    if (!authorSeat || authorSeat === voter) return []
    return [{ voter, authorSeat }]
  })

  const mistakenVotes = Object.fromEntries(SEATS.map(seat => [seat, 0])) as Record<SeatId, number>
  for (const vote of validVotes) {
    if (vote.authorSeat !== aiSeat) mistakenVotes[vote.authorSeat] += 1
  }
  const highestHumanMistakes = Math.max(...humans.map(seat => mistakenVotes[seat]))

  return Object.fromEntries(SEATS.map(seat => {
    if (seat === aiSeat) return [seat, { correctGuess: 0, topMisidentified: 0, misidentificationVotes: 0, total: 0 }]
    const correctGuess = validVotes.some(vote => vote.voter === seat && vote.authorSeat === aiSeat) ? 2 : 0
    const topMisidentified = highestHumanMistakes > 0 && mistakenVotes[seat] === highestHumanMistakes ? 3 : 0
    return [seat, {
      correctGuess,
      topMisidentified,
      misidentificationVotes: mistakenVotes[seat],
      total: correctGuess + topMisidentified,
    }]
  })) as Record<SeatId, RoundScoreBreakdown>
}

export function calculateScores(aiSeat: SeatId, ballots: GameBallots, contentSlots: RoundSlots): ScoreBreakdown[] {
  const byRound = Object.fromEntries(ROUNDS.map(round => [round, calculateRoundScores(round, aiSeat, ballots, contentSlots)])) as Record<RoundNumber, Record<SeatId, RoundScoreBreakdown>>
  const unsorted = humanSeats(aiSeat).map(seat => {
    const rounds = {
      1: byRound[1][seat],
      2: byRound[2][seat],
      3: byRound[3][seat],
    }
    return { seat, rounds, total: ROUNDS.reduce((sum, round) => sum + rounds[round].total, 0), rank: 0 }
  })
  const ranked = unsorted.map(score => ({
    ...score,
    rank: 1 + unsorted.filter(other => other.total > score.total).length,
  }))
  return ranked.sort((a, b) => b.total - a.total || a.seat.localeCompare(b.seat))
}

export function achievementsFor(score: ScoreBreakdown, scores: ScoreBreakdown[]): string[] {
  const achievements = ['完成一局']
  if (ROUNDS.every(round => score.rounds[round].correctGuess === 2)) achievements.push('三轮全中')
  if (ROUNDS.filter(round => score.rounds[round].topMisidentified === 3).length >= 2) achievements.push('最像 AI')
  if (score.total === Math.max(...scores.map(item => item.total))) achievements.push('本局最高分')
  return achievements
}
