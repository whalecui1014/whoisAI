import { OUTFITS } from '../../game/data'
import type { OutfitId, SeatId } from '../../game/types'

interface CharacterProps {
  seat: SeatId
  outfit: OutfitId
  size?: 'small' | 'medium' | 'large'
  selected?: boolean
  current?: boolean
  revealedAi?: boolean
}

export function Character({ seat, outfit, size = 'medium', selected, current, revealedAi }: CharacterProps) {
  const item = OUTFITS[outfit]
  return (
    <div className={`character character-${size} character-outfit-${outfit} ${selected ? 'is-selected' : ''} ${revealedAi ? 'is-ai-revealed' : ''}`} style={{ '--seat-color': item.color } as React.CSSProperties}>
      <div className="character-image-wrap">
        <img src={item.src} alt={`玩家 ${seat}，穿${item.label}的刘看山`} />
        {revealedAi && <span className="ai-reveal-badge">AI</span>}
      </div>
      <div className="character-label"><strong>{seat}</strong><span>{current ? '你 · ' : ''}{item.label}</span></div>
    </div>
  )
}
