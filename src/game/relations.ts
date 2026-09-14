import { humanSeats } from './scoring'
import type { GameBallots, RelationCardData, SeatId } from './types'

export function generateRelationCards(userSeat: SeatId, aiSeat: SeatId, ballots: GameBallots): RelationCardData[] {
  const others = humanSeats(aiSeat).filter(seat => seat !== userSeat)
  const cards: RelationCardData[] = []

  for (const other of others) {
    const userFinal = ballots.finalIdentity[userSeat]
    const otherFinal = ballots.finalIdentity[other]
    const base = { id: `${userSeat}-${other}`, otherSeat: other }

    if (userFinal === other && otherFinal === userSeat) {
      cards.push({ ...base, type: 'mutualMistake', title: `你和 ${other} 互相把对方当成了 AI。`, detail: `最终指认时，你投了 ${other}，${other} 也投了你。`, evidence: [`你的最终票：${other}`, `${other} 的最终票：${userSeat}`] })
    } else if (userFinal === other) {
      cards.push({ ...base, type: 'youMistook', title: `你把 ${other} 当成了 AI。`, detail: `${other} 是真人，AI 是 ${aiSeat}。`, evidence: [`你的最终票：${other}`, `真实 AI：${aiSeat}`] })
    } else if (otherFinal === userSeat) {
      cards.push({ ...base, type: 'theyMistook', title: `${other} 把你当成了 AI。`, detail: `最终指认时，${other} 把票投给了你。`, evidence: [`${other} 的最终票：${userSeat}`, `真实 AI：${aiSeat}`] })
    } else if (userFinal === aiSeat && otherFinal === aiSeat) {
      cards.push({ ...base, type: 'sharedDetect', title: `你和 ${other} 都猜中了 AI。`, detail: `你们的最终票都投给了 ${aiSeat}。`, evidence: [`你的最终票：${aiSeat}`, `${other} 的最终票：${aiSeat}`] })
    } else if (ballots.round3Quality[userSeat] === other) {
      cards.push({ ...base, type: 'contentRecognition', title: `你选了 ${other} 的问题。`, detail: `你在第三轮把问题票投给了 ${other}。`, evidence: [`你选的问题：${other}`] })
    } else if (ballots.round3Quality[other] === userSeat) {
      cards.push({ ...base, type: 'contentRecognition', title: `${other} 选了你的问题。`, detail: `${other} 在第三轮把问题票投给了你。`, evidence: [`${other} 选的问题：${userSeat}`] })
    } else if (ballots.round2Quality[userSeat] === other) {
      cards.push({ ...base, type: 'contentRecognition', title: `你选了 ${other} 的评论。`, detail: `你在第二轮把评论票投给了 ${other}。`, evidence: [`你选的评论：${other}`] })
    } else if (ballots.round2Quality[other] === userSeat) {
      cards.push({ ...base, type: 'contentRecognition', title: `${other} 选了你的评论。`, detail: `${other} 在第二轮把评论票投给了你。`, evidence: [`${other} 选的评论：${userSeat}`] })
    }
  }

  return cards.slice(0, 2)
}
