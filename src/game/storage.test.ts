import { describe, expect, it } from 'vitest'
import { createGame } from './machine'
import { isGameState } from './storage'

describe('persisted-state validation', () => {
  it('accepts a complete game state', () => {
    expect(isGameState(createGame())).toBe(true)
  })

  it('rejects same-version partial or structurally invalid data', () => {
    expect(isGameState({ version: 2, phase: 'lobby' })).toBe(false)
    expect(isGameState({ ...createGame(), userSeat: 'Z' })).toBe(false)
    expect(isGameState({ ...createGame(), ballots: { round1Identity: { A: 'A' } } })).toBe(false)
  })
})
