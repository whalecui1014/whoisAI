import { CircleHelp, RotateCcw, SkipForward } from 'lucide-react'
import { PHASE_LABELS, publicAssetUrl } from '../../game/data'
import type { GamePhase } from '../../game/types'

interface GameHeaderProps {
  phase: GamePhase
  seconds: number
  onRules: () => void
  onReset: () => void
  onTestNext?: () => void
}

export function GameHeader({ phase, seconds, onRules, onReset, onTestNext }: GameHeaderProps) {
  return (
    <header className="game-header">
      <div className="game-header-inner">
        <div className="brand-group">
          <img src={publicAssetUrl('assets/zhihu-logo.png')} alt="知乎" />
          <i />
          <strong>谁是人机</strong>
          <span className="event-pill">知乎活动</span>
        </div>
        <nav>
          {phase !== 'landing' && <span className="current-stage">{PHASE_LABELS[phase]}</span>}
          {seconds > 0 && <span className="stage-timer">还剩 {seconds} 秒</span>}
          <button onClick={onRules}><CircleHelp size={17} />玩法说明</button>
          {onTestNext && <button className="test-next-button" onClick={onTestNext}><SkipForward size={16} />下一阶段</button>}
          {phase !== 'landing' && <button onClick={onReset}><RotateCcw size={16} />退出本局</button>}
        </nav>
      </div>
    </header>
  )
}
