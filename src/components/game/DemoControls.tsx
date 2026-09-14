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
  onEnd: () => void
  onReset: () => void
}

export function DemoControls(props: DemoControlsProps) {
  const [open, setOpen] = useState(false)
  if (props.phase === 'landing' || props.phase === 'lobby' || props.phase === 'settlement') return null
  return (
    <aside className={`demo-controls ${open ? 'open' : ''}`} aria-label="调试控制">
      <button className="demo-handle" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-label={open ? '收起调试控制' : '展开调试控制'}>
        <span><i />调试控制</span><ChevronUp size={16} />
      </button>
      {open && <div className="demo-body">
        <div className="demo-status"><span>{PHASE_LABELS[props.phase]}</span>{props.seconds > 0 && <strong>还剩 {props.seconds} 秒</strong>}</div>
        <div className="demo-buttons">
          <button onClick={props.onPause}>{props.paused ? <Play size={15} /> : <Pause size={15} />}{props.paused ? '继续' : '暂停'}</button>
          <button onClick={props.onSpeed}><FastForward size={15} />{props.speed}×</button>
          <button onClick={props.onEnd}><SkipForward size={15} />结束本阶段</button>
          <button onClick={props.onReset}><RotateCcw size={15} />重置</button>
        </div>
        <p>快进不会跳过你必须完成的提交或投票。</p>
      </div>}
    </aside>
  )
}
