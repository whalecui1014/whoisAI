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
      cards.push({ ...base, type: 'mutualMistake', title: `你和 ${other} 互相把对方当成了 AI。`, detail: `最后一轮，你投了 ${other}，${other} 也投了你。`, evidence: [`最后一轮，你投给了：${other}`, `最后一轮，${other} 投给了：${userSeat}`] })
    } else if (userFinal === other) {
      cards.push({ ...base, type: 'youMistook', title: `你把 ${other} 当成了 AI。`, detail: `${other} 是真人，AI 是 ${aiSeat}。`, evidence: [`最后一轮，你投给了：${other}`, `AI 是：${aiSeat}`] })
    } else if (otherFinal === userSeat) {
      cards.push({ ...base, type: 'theyMistook', title: `${other} 把你当成了 AI。`, detail: `最后一轮，${other} 投给了你。`, evidence: [`最后一轮，${other} 投给了：${userSeat}`, `AI 是：${aiSeat}`] })
    } else if (userFinal === aiSeat && otherFinal === aiSeat) {
      cards.push({ ...base, type: 'sharedDetect', title: `你和 ${other} 都猜中了 AI。`, detail: `最后一轮，你们都投给了 ${aiSeat}。`, evidence: [`最后一轮，你投给了：${aiSeat}`, `最后一轮，${other} 投给了：${aiSeat}`] })
    } else if (ballots.round3Quality[userSeat] === other) {
      cards.push({ ...base, type: 'contentRecognition', title: `你选了 ${other} 的问题。`, detail: `第三轮，你选中了 ${other} 提的问题。`, evidence: [`你选了 ${other} 的问题。`] })
    } else if (ballots.round3Quality[other] === userSeat) {
      cards.push({ ...base, type: 'contentRecognition', title: `${other} 选了你的问题。`, detail: `第三轮，${other} 选中了你提的问题。`, evidence: [`${other} 选了你的问题。`] })
    } else if (ballots.round2Quality[userSeat] === other) {
      cards.push({ ...base, type: 'contentRecognition', title: `你选了 ${other} 的评论。`, detail: `第二轮，你给 ${other} 的评论投了一票。`, evidence: [`你选了 ${other} 的评论。`] })
    } else if (ballots.round2Quality[other] === userSeat) {
      cards.push({ ...base, type: 'contentRecognition', title: `${other} 选了你的评论。`, detail: `第二轮，${other} 给你的评论投了一票。`, evidence: [`${other} 选了你的评论。`] })
    }
  }

  return cards.slice(0, 2)
}
