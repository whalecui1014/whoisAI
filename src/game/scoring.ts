import { SEATS } from './data'
import type { GameBallots, ScoreBreakdown, SeatId } from './types'

export function humanSeats(aiSeat: SeatId): SeatId[] {
  return SEATS.filter(seat => seat !== aiSeat)
}

export function calculateScores(aiSeat: SeatId, ballots: GameBallots): ScoreBreakdown[] {
  const humans = humanSeats(aiSeat)
  return humans.map(seat => {
    const otherHumans = humans.filter(other => other !== seat)
    const masquerade = otherHumans.filter(voter => ballots.round1Identity[voter] === seat).length
    const firstDetect = ballots.round1Identity[seat] === aiSeat ? 2 : 0
    const comment = otherHumans.filter(voter => ballots.round2Quality[voter] === seat).length * 2
    const question = otherHumans.filter(voter => ballots.round3Quality[voter] === seat).length * 2
    const finalDetect = ballots.finalIdentity[seat] === aiSeat ? 3 : 0
    return { seat, masquerade, firstDetect, comment, question, finalDetect, total: masquerade + firstDetect + comment + question + finalDetect }
  }).sort((a, b) => b.total - a.total || a.seat.localeCompare(b.seat))
}

export function achievementsFor(score: ScoreBreakdown, scores: ScoreBreakdown[]): string[] {
  const max = Math.max(...scores.map(item => item.total))
  const achievements = ['完成一局']
  if (score.masquerade === 2) achievements.push('反串成功')
  if (score.comment === 4) achievements.push('评论被两人选中')
  if (score.question === 4) achievements.push('提问被两人选中')
  if (score.firstDetect === 2 && score.finalDetect === 3) achievements.push('两次猜中 AI')
  if (score.total === max) achievements.push('本局最高分')
  return achievements
}
