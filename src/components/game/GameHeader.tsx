import { CircleHelp, RotateCcw } from 'lucide-react'
import { PHASE_LABELS } from '../../game/data'
import type { GamePhase } from '../../game/types'

interface GameHeaderProps {
  phase: GamePhase
  onRules: () => void
  onReset: () => void
}

export function GameHeader({ phase, onRules, onReset }: GameHeaderProps) {
  return (
    <header className="game-header">
      <div className="game-header-inner">
        <div className="brand-group">
          <img src="/assets/zhihu-logo.png" alt="知乎" />
          <i />
          <strong>谁是人机</strong>
          <span className="event-pill">Hackathon Demo</span>
        </div>
        <nav>
          {phase !== 'landing' && <span className="current-stage">{PHASE_LABELS[phase]}</span>}
          <button onClick={onRules}><CircleHelp size={17} />玩法说明</button>
          {phase !== 'landing' && <button onClick={onReset}><RotateCcw size={16} />退出试玩</button>}
        </nav>
      </div>
    </header>
  )
}
