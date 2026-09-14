import type { BallotType, SeatId } from './types'

export interface VoteRequest {
  gameId: string
  ballot: BallotType
  voter: SeatId
  target: SeatId
}

export interface VoteReceipt extends VoteRequest {
  acceptedAt: number
}

interface LocalVoteServiceOptions {
  latencyMs?: number
  shouldFail?: (request: VoteRequest, attempt: number) => boolean
}

export function createLocalVoteService(options: LocalVoteServiceOptions = {}) {
  const receipts = new Map<string, VoteReceipt>()
  const attempts = new Map<string, number>()

  return {
    async submitVote(request: VoteRequest): Promise<VoteReceipt> {
      if (request.voter === request.target) throw new Error('不能给自己的席位投票。')

      const key = `${request.gameId}:${request.ballot}:${request.voter}`
      const attempt = (attempts.get(key) ?? 0) + 1
      attempts.set(key, attempt)
      if (options.latencyMs !== 0) {
        await new Promise(resolve => window.setTimeout(resolve, options.latencyMs ?? 180))
      }
      if (options.shouldFail?.(request, attempt)) throw new Error('投票没有提交成功，请重试。')

      const existing = receipts.get(key)
      if (existing) {
        if (existing.target !== request.target) throw new Error('这张选票已经提交，不能改投。')
        return existing
      }

      const receipt = { ...request, acceptedAt: Date.now() }
      receipts.set(key, receipt)
      return receipt
    },
  }
}

// 前端单人版中的本地服务替身；真实多人版应由服务端持有并校验选票。
export const localVoteService = createLocalVoteService()
