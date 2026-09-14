import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createGame } from './machine'
import { isGameState, loadGame, saveGame } from './storage'

const data = new Map<string, string>()

beforeEach(() => {
  data.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
  })
})

describe('persisted-state validation', () => {
  it('accepts and restores a complete version-three game state', () => {
    const state = createGame(0, 'round2Write')
    expect(isGameState(state)).toBe(true)
    expect(saveGame(state)).toBe(true)
    expect(loadGame()).toEqual(state)
  })

  it('rejects partial state, duplicated slots, AI ballots and self votes', () => {
    const state = createGame()
    expect(isGameState({ version: 3, phase: 'lobby' })).toBe(false)
    expect(isGameState({ ...state, userSeat: 'Z' })).toBe(false)
    const duplicated = structuredClone(state)
    duplicated.contentSlots[1][1] = { ...duplicated.contentSlots[1][0] }
    expect(isGameState(duplicated)).toBe(false)
    const aiVote = structuredClone(state)
    aiVote.ballots[1][aiVote.aiSeat] = aiVote.contentSlots[1][0].contentId
    expect(isGameState(aiVote)).toBe(false)
    const selfVote = structuredClone(state)
    selfVote.ballots[1][selfVote.userSeat] = selfVote.contentSlots[1].find(slot => slot.authorSeat === selfVote.userSeat)!.contentId
    expect(isGameState(selfVote)).toBe(false)
  })

  it('persists each round anonymous order exactly', () => {
    const state = createGame(0, 'round1Vote')
    saveGame(state)
    expect(loadGame().contentSlots).toEqual(state.contentSlots)
  })

  it('restores a reading phase without starting its clock', () => {
    const state = createGame(0, 'round2Read')
    state.drafts[1] = '上一轮已经保存的草稿'
    saveGame(state)

    const restored = loadGame()
    expect(restored.phase).toBe('round2Read')
    expect(restored.secondsLeft).toBe(0)
    expect(restored.drafts[1]).toBe('上一轮已经保存的草稿')
  })

  it('restores a writing draft and its remaining time exactly', () => {
    const state = createGame(0, 'round3Write')
    state.drafts[3] = '刷新后还在的问题？'
    state.secondsLeft = 87
    saveGame(state)

    const restored = loadGame()
    expect(restored.phase).toBe('round3Write')
    expect(restored.secondsLeft).toBe(87)
    expect(restored.drafts[3]).toBe('刷新后还在的问题？')
  })

  it('migrates removed per-round reveal phases to the next reading phase', () => {
    const firstReveal = { ...createGame(0, 'round1Vote'), phase: 'round1Reveal', secondsLeft: 7 }
    data.set('who-is-ai-v4', JSON.stringify(firstReveal))
    expect(loadGame().phase).toBe('round2Read')
    expect(loadGame().secondsLeft).toBe(0)

    const secondReveal = { ...createGame(0, 'round2Vote'), phase: 'round2Reveal', secondsLeft: 4 }
    data.set('who-is-ai-v4', JSON.stringify(secondReveal))
    expect(loadGame().phase).toBe('round3Read')
    expect(loadGame().secondsLeft).toBe(0)
  })
})
