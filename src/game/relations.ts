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
      cards.push({ ...base, type: 'mutualMistake', title: '原来你们刚才互相觉得对方是人机。', detail: `最终指认时，你投了 ${other}，${other} 也投了你。`, evidence: [`你的最终票：${other}`, `${other} 的最终票：${userSeat}`] })
    } else if (userFinal === other) {
      cards.push({ ...base, type: 'youMistook', title: `你刚才把 ${other} 认成了人机。`, detail: `结果 ${other} 也是真人，真正的 AI 是 ${aiSeat}。`, evidence: [`你的最终票：${other}`, `真实 AI：${aiSeat}`] })
    } else if (otherFinal === userSeat) {
      cards.push({ ...base, type: 'theyMistook', title: `${other} 刚才把你认成了人机。`, detail: `最终指认时，${other} 把票投给了你。`, evidence: [`${other} 的最终票：${userSeat}`, `真实 AI：${aiSeat}`] })
    } else if (userFinal === aiSeat && otherFinal === aiSeat) {
      cards.push({ ...base, type: 'sharedDetect', title: `你刚才和 ${other} 一起识破了 AI。`, detail: `最终指认时，你们都投给了 ${aiSeat}。`, evidence: [`你的最终票：${aiSeat}`, `${other} 的最终票：${aiSeat}`] })
    } else if (ballots.round3Quality[userSeat] === other) {
      cards.push({ ...base, type: 'contentRecognition', title: `你选中了 ${other} 的提问。`, detail: '这是第三轮真实发生的内容认可。', evidence: [`你的第三轮质量票：${other}`] })
    } else if (ballots.round3Quality[other] === userSeat) {
      cards.push({ ...base, type: 'contentRecognition', title: `${other} 选中了你的提问。`, detail: '这是第三轮真实发生的内容认可。', evidence: [`${other} 的第三轮质量票：${userSeat}`] })
    } else if (ballots.round2Quality[userSeat] === other) {
      cards.push({ ...base, type: 'contentRecognition', title: `你给 ${other} 的评论投了票。`, detail: '这是第二轮真实发生的内容认可。', evidence: [`你的第二轮质量票：${other}`] })
    } else if (ballots.round2Quality[other] === userSeat) {
      cards.push({ ...base, type: 'contentRecognition', title: `${other} 选中了你的评论。`, detail: '这是第二轮真实发生的内容认可。', evidence: [`${other} 的第二轮质量票：${userSeat}`] })
    }
  }

  return cards.slice(0, 2)
}
