import { ChevronUp, FastForward, Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { useState } from 'react'
import { PHASE_LABELS } from '../../game/data'
import type { GamePhase } from '../../game/types'

interface DemoControlsProps {
  phase: GamePhase
  seconds: number
  paused: boolean
  speed: 1 | 5
  onPause: () => void
  onSpeed: () => void
  onNext: () => void
  onReset: () => void
}

export function DemoControls(props: DemoControlsProps) {
  const [open, setOpen] = useState(false)
  if (props.phase === 'landing' || props.phase === 'settlement') return null
  return (
    <aside className={`demo-controls ${open ? 'open' : ''}`} aria-label="对局控制">
      <button className="demo-handle" onClick={() => setOpen(value => !value)} aria-expanded={open}>
        <span><i />对局控制</span><ChevronUp size={16} />
      </button>
      {open && <div className="demo-body">
        <div className="demo-status"><span>{PHASE_LABELS[props.phase]}</span><strong>{props.seconds > 0 ? `${props.seconds}s` : '等待操作'}</strong></div>
        <div className="demo-buttons">
          <button onClick={props.onPause}>{props.paused ? <Play size={15} /> : <Pause size={15} />}{props.paused ? '继续' : '暂停'}</button>
          <button onClick={props.onSpeed}><FastForward size={15} />{props.speed}×</button>
          <button onClick={props.onNext}><SkipForward size={15} />下一阶段</button>
          <button onClick={props.onReset}><RotateCcw size={15} />重置</button>
        </div>
        <p>快进不会跳过你必须完成的提交或投票。</p>
      </div>}
    </aside>
  )
}
