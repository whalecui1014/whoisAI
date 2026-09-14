import { describe, expect, it } from 'vitest'
import { createLocalVoteService } from './mockService'

const request = { gameId: 'game-test', round: 1 as const, voter: 'A' as const, targetContentId: '4' as const, ownContentId: '2' as const }

describe('local vote service', () => {
  it('is idempotent for duplicate requests and rejects a later change', async () => {
    const service = createLocalVoteService({ latencyMs: 0 })
    const first = await service.submitVote(request)
    const duplicate = await service.submitVote(request)
    expect(duplicate).toEqual(first)
    await expect(service.submitVote({ ...request, targetContentId: '3' })).rejects.toThrow('不能改投')
  })

  it('allows retry after a transport failure without recording the failed vote', async () => {
    const service = createLocalVoteService({ latencyMs: 0, shouldFail: (_request, attempt) => attempt === 1 })
    await expect(service.submitVote(request)).rejects.toThrow('请重试')
    await expect(service.submitVote(request)).resolves.toMatchObject({ targetContentId: '4' })
  })

  it('rejects the current player own content id', async () => {
    const service = createLocalVoteService({ latencyMs: 0 })
    await expect(service.submitVote({ ...request, targetContentId: '2' })).rejects.toThrow('不能投自己')
  })

  it('keeps each round as a separate ballot', async () => {
    const service = createLocalVoteService({ latencyMs: 0 })
    await expect(service.submitVote(request)).resolves.toMatchObject({ round: 1 })
    await expect(service.submitVote({ ...request, round: 2, targetContentId: '3' })).resolves.toMatchObject({ round: 2, targetContentId: '3' })
  })
})
