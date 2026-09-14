import { describe, expect, it } from 'vitest'
import { createLocalVoteService } from './mockService'

const request = { gameId: 'game-test', ballot: 'round1Identity' as const, voter: 'A' as const, target: 'D' as const }

describe('local vote service', () => {
  it('is idempotent for duplicate requests and rejects a later change', async () => {
    const service = createLocalVoteService({ latencyMs: 0 })
    const first = await service.submitVote(request)
    const duplicate = await service.submitVote(request)
    expect(duplicate).toEqual(first)
    await expect(service.submitVote({ ...request, target: 'B' })).rejects.toThrow('不能改投')
  })

  it('allows retry after a transport failure without recording the failed vote', async () => {
    const service = createLocalVoteService({ latencyMs: 0, shouldFail: (_request, attempt) => attempt === 1 })
    await expect(service.submitVote(request)).rejects.toThrow('请重试')
    await expect(service.submitVote(request)).resolves.toMatchObject({ target: 'D' })
  })

  it('rejects self-voting', async () => {
    const service = createLocalVoteService({ latencyMs: 0 })
    await expect(service.submitVote({ ...request, target: 'A' })).rejects.toThrow('不能给自己')
  })
})
