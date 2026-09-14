export type SeatId = 'A' | 'B' | 'C' | 'D'
export type OutfitId = 'blue' | 'green' | 'yellow' | 'purple'
export type RoundNumber = 1 | 2 | 3

export type GamePhase =
  | 'landing'
  | 'lobby'
  | 'reading'
  | 'round1Write'
  | 'round1Public'
  | 'round1Vote'
  | 'round2Write'
  | 'round2Public'
  | 'round2Vote'
  | 'round3Write'
  | 'round3Public'
  | 'round3QualityVote'
  | 'finalIdentityVote'
  | 'reveal'
  | 'settlement'

export type BallotType = 'round1Identity' | 'round2Quality' | 'round3Quality' | 'finalIdentity'

export interface GameBallots {
  round1Identity: Partial<Record<SeatId, SeatId>>
  round2Quality: Partial<Record<SeatId, SeatId>>
  round3Quality: Partial<Record<SeatId, SeatId>>
  finalIdentity: Partial<Record<SeatId, SeatId>>
}

export interface GameState {
  version: 1
  gameId: string
  rematchIndex: number
  phase: GamePhase
  userSeat: SeatId
  aiSeat: SeatId
  outfitBySeat: Record<SeatId, OutfitId>
  submissions: Record<RoundNumber, Partial<Record<SeatId, string>>>
  drafts: Record<RoundNumber, string>
  ballots: GameBallots
  selections: Partial<Record<BallotType, SeatId>>
  paused: boolean
  speed: 1 | 5
  secondsLeft: number
  graceUsed: boolean
  gameValid: boolean
  invalidReason?: string
  notice?: string
  settled: boolean
}

export interface ScoreBreakdown {
  seat: SeatId
  masquerade: number
  firstDetect: number
  comment: number
  question: number
  finalDetect: number
  total: number
}

export type RelationType = 'mutualMistake' | 'youMistook' | 'theyMistook' | 'sharedDetect' | 'contentRecognition'

export interface RelationCardData {
  id: string
  otherSeat: SeatId
  type: RelationType
  title: string
  detail: string
  evidence: string[]
}
