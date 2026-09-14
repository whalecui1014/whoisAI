export type SeatId = 'A' | 'B' | 'C' | 'D'
export type OutfitId = 'blue' | 'green' | 'yellow' | 'purple'
export type RoundNumber = 1 | 2 | 3
export type ContentId = '1' | '2' | '3' | '4'

export type GamePhase =
  | 'landing'
  | 'lobby'
  | 'round1Read'
  | 'round1Write'
  | 'round1Vote'
  | 'round2Read'
  | 'round2Write'
  | 'round2Vote'
  | 'round3Read'
  | 'round3Write'
  | 'round3Vote'
  | 'settlement'

export type AiContentStatus = 'idle' | 'loading' | 'ready' | 'error'
export type AiContentSource = 'preset' | 'model'

export interface GeneratedGameContent {
  source: AiContentSource
  submissions: Record<RoundNumber, string>
}

export interface RoundContentSlot {
  contentId: ContentId
  authorSeat: SeatId
}

export type RoundSlots = Record<RoundNumber, RoundContentSlot[]>
export type GameBallots = Record<RoundNumber, Partial<Record<SeatId, ContentId>>>

export interface GameState {
  version: 3
  gameId: string
  rematchIndex: number
  phase: GamePhase
  userSeat: SeatId
  aiSeat: SeatId
  outfitBySeat: Record<SeatId, OutfitId>
  contentSlots: RoundSlots
  submissions: Record<RoundNumber, Partial<Record<SeatId, string>>>
  drafts: Record<RoundNumber, string>
  ballots: GameBallots
  aiContentStatus: AiContentStatus
  aiContentSource?: AiContentSource
  aiContentError?: string
  paused: boolean
  speed: 1 | 5
  secondsLeft: number
  graceUsed: boolean
  gameValid: boolean
  invalidReason?: string
  notice?: string
  settled: boolean
}

export interface RoundScoreBreakdown {
  correctGuess: 0 | 2
  topMisidentified: 0 | 3
  misidentificationVotes: number
  total: number
}

export interface ScoreBreakdown {
  seat: SeatId
  rounds: Record<RoundNumber, RoundScoreBreakdown>
  total: number
  rank: number
}
