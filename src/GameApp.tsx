import { Check, ChevronDown, Clipboard, Clock3, Copy, Crown, Eye, FileText, Info, LockKeyhole, MessageCircle, RotateCcw, Sparkles, ThumbsUp, Trophy, Users, X } from 'lucide-react'
import { useEffect, useMemo, useReducer, useState } from 'react'
import { Character } from './components/game/Character'
import { DemoControls } from './components/game/DemoControls'
import { GameHeader } from './components/game/GameHeader'
import { PHASE_LABELS, PHASE_ORDER, POST, ROUND_COPY, SEATS } from './game/data'
import { countVisibleCharacters, validateSubmission } from './game/graphemes'
import { completeBallots, gameReducer, phaseNeedsAction } from './game/machine'
import { generateRelationCards } from './game/relations'
import { achievementsFor, calculateScores } from './game/scoring'
import { loadGame, saveGame } from './game/storage'
import type { BallotType, GamePhase, GameState, RelationCardData, RoundNumber, SeatId } from './game/types'

function PrimaryButton({ children, onClick, disabled, className = '' }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; className?: string }) {
  return <button className={`primary-button ${className}`} onClick={onClick} disabled={disabled}>{children}</button>
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button className="secondary-button" onClick={onClick}>{children}</button>
}

function RulesModal({ onClose }: { onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className="rules-modal" role="dialog" aria-modal="true" aria-labelledby="rules-title">
      <button className="modal-close" onClick={onClose} aria-label="关闭规则"><X size={20} /></button>
      <span className="eyebrow">约 6 分钟 · 3 真人 + 1 AI</span>
      <h2 id="rules-title">三轮，找出谁是人机</h2>
      <ol className="rule-steps">
        <li><strong>1</strong><div><b>全员装人机</b><span>故意写得像 AI，再猜谁背后真正是 AI。</span></div></li>
        <li><strong>2</strong><div><b>这次认真说</b><span>写下真实观点，选出最值得点赞的评论。</span></div></li>
        <li><strong>3</strong><div><b>这问题值得问</b><span>看到新条件后提问，再做最终身份指认。</span></div></li>
      </ol>
      <div className="rules-score"><b>最高 15 分</b><span>反串 2 + 初次识破 2 + 评论 4 + 提问 4 + 最终识破 3</span></div>
      <p className="muted-copy">每条最多 50 字，不能投自己。身份会在最终锁票后统一揭晓。</p>
      <PrimaryButton onClick={onClose}>知道了</PrimaryButton>
    </section>
  </div>
}

function CharacterGrid({ state, large = false, reveal = false }: { state: GameState; large?: boolean; reveal?: boolean }) {
  return <div className={`character-grid ${large ? 'large' : ''}`}>
    {SEATS.map(seat => <Character key={seat} seat={seat} outfit={state.outfitBySeat[seat]} size={large ? 'large' : 'medium'} current={seat === state.userSeat} revealedAi={reveal && seat === state.aiSeat} />)}
  </div>
}

function Landing({ onStart, onRules, state }: { onStart: () => void; onRules: () => void; state: GameState }) {
  return <main className="landing-page" data-screen="landing">
    <section className="hero-section">
      <div className="hero-copy">
        <span className="eyebrow"><Sparkles size={15} />知乎官方 Hackathon</span>
        <h1>快来知乎<br />找人机！</h1>
        <h2>这次，真人也来装 AI。</h2>
        <p>三轮，每条最多 50 字。先装人机，认真评论，最后猜出 AI。</p>
        <div className="hero-actions"><PrimaryButton onClick={onStart}>开始游戏</PrimaryButton><SecondaryButton onClick={onRules}>看看怎么玩</SecondaryButton></div>
      </div>
      <div className="hero-characters" aria-label="四个游戏角色"><CharacterGrid state={state} large /></div>
    </section>
    <section className="topic-preview">
      <div><span>本局话题</span><h3>{POST.title}</h3><p>{POST.sourceType}</p></div>
      <span className="topic-tag">房租与通勤</span>
    </section>
  </main>
}

function StageProgress({ phase }: { phase: GamePhase }) {
  const active = PHASE_ORDER.indexOf(phase)
  const steps = [
    ['准备', 0], ['阅读', 1], ['第一轮', 2], ['第二轮', 5], ['第三轮', 8], ['揭晓', 12], ['结算', 13],
  ] as const
  return <div className="stage-progress">
    {steps.map(([label, index], stepIndex) => <div key={label} className={active >= index ? 'done' : ''}><i>{active > index ? <Check size={12} /> : stepIndex + 1}</i><span>{label}</span></div>)}
  </div>
}

function Lobby({ state, onReady }: { state: GameState; onReady: () => void }) {
  return <GamePage state={state} sidebar={<LobbyAside state={state} />}>
    <section className="content-card lobby-card" data-screen="lobby">
      <span className="eyebrow">对局准备</span><h1>本局角色已就位</h1>
      <p className="lead">席位和服装会在整局保持不变。AI 在揭晓前不会有特殊标记。</p>
      <CharacterGrid state={state} large />
      <div className="solo-notice"><Users size={20} /><div><strong>本局席位说明</strong><span>你控制席位 {state.userSeat}。其余三席使用本地预设内容，其中包含两个真人身份和一个 AI 身份，不是在匹配真实用户。</span></div></div>
      <PrimaryButton onClick={onReady}>准备好了</PrimaryButton>
    </section>
  </GamePage>
}

function LobbyAside({ state }: { state: GameState }) {
  return <><SidePost /><aside className="side-card"><span className="side-kicker">本局编号</span><strong className="mono">{state.gameId}</strong><p>角色身份为本局预设数据，不代表在线用户或真实模型调用。</p></aside></>
}

function SidePost({ showCondition = false }: { showCondition?: boolean }) {
  return <aside className="side-card post-side-card"><span className="side-kicker">本局原帖摘录</span><h3>{POST.title}</h3><p>{POST.excerpt}</p><div className="source-chip"><FileText size={14} />{POST.sourceType}</div>{showCondition && <div className="condition-mini"><b>游戏假设</b>{POST.newCondition}</div>}</aside>
}

function PublishedHistory({ state, through }: { state: GameState; through: number }) {
  if (through < 1) return null
  return <aside className="side-card published-history"><details><summary>回看已公开轮次 <ChevronDown size={15} /></summary>{([1, 2, 3] as RoundNumber[]).filter(round => round <= through).map(round => <section key={round}><b>{ROUND_COPY[round].kicker}</b>{SEATS.map(seat => <p key={seat}><strong>{seat}</strong>{state.submissions[round][seat]}</p>)}</section>)}</details></aside>
}

function GamePage({ state, children, sidebar }: { state: GameState; children: React.ReactNode; sidebar?: React.ReactNode }) {
  return <main className="game-page"><StageProgress phase={state.phase} /><div className={`game-columns ${sidebar ? '' : 'single'}`}><div>{children}</div>{sidebar && <div className="game-sidebar">{sidebar}</div>}</div></main>
}

function Reading({ state, onNext }: { state: GameState; onNext: () => void }) {
  return <GamePage state={state} sidebar={<aside className="side-card rules-side"><span className="side-kicker">三轮目标</span><ol><li><b>装人机</b><span>写反串，猜身份</span></li><li><b>认真说</b><span>写评论，评内容</span></li><li><b>值得问</b><span>写问题，再终猜</span></li></ol><details><summary>展开计分规则 <ChevronDown size={15} /></summary><p>反串最多 2 分；初次识破 2 分；评论与问题各最多 4 分；最终识破 3 分。</p></details></aside>}>
    <article className="content-card reading-card" data-screen="reading">
      <span className="eyebrow">阅读阶段</span><h1>{POST.title}</h1>
      <div className="answer-source"><div className="source-avatar">答</div><div><b>回答摘录</b><span>本局原创情境内容，不对应真实作者、赞同数或原帖链接</span></div></div>
      <blockquote>{POST.excerpt}</blockquote>
      <div className="reading-note"><LockKeyhole size={18} /><span>第三轮会出现一个新条件，现在不会提前展示。</span></div>
      <PrimaryButton onClick={onNext}>读完了，开始第一轮</PrimaryButton>
    </article>
  </GamePage>
}

function RoundHeader({ round }: { round: RoundNumber }) {
  const copy = ROUND_COPY[round]
  return <header className="round-heading"><span className="eyebrow">{copy.kicker}</span><h1>{copy.title}</h1><p>{copy.task}</p></header>
}

function WritingScreen({ state, round, dispatch }: { state: GameState; round: RoundNumber; dispatch: React.Dispatch<Parameters<typeof gameReducer>[1]> }) {
  const draft = state.drafts[round]
  const count = countVisibleCharacters(draft)
  const locked = Boolean(state.submissions[round][state.userSeat])
  const error = !locked && draft.length > 0 ? validateSubmission(draft) : null
  return <GamePage state={state} sidebar={<><SidePost showCondition={round === 3} />{round > 1 && <PublishedHistory state={state} through={round - 1} />}<aside className="side-card hint-card"><span className="side-kicker">起手提示</span>{ROUND_COPY[round].hints.map(item => <span key={item}>{item}</span>)}<p>提示只帮你起步，不会代写完整答案。</p></aside></>}>
    <section className="content-card writing-card" data-screen={`round-${round}-write`}>
      <RoundHeader round={round} />
      {round === 2 && <div className="tone-shift"><MessageCircle size={18} /><span><b>反串结束。</b>这一轮恢复认真表达，不再猜身份。</span></div>}
      {round === 3 && <div className="new-condition"><span>游戏假设</span><strong>{POST.newCondition}</strong><p>这是本局新增条件，不是题主真实更新。</p></div>}
      <label className={`composer ${error ? 'has-error' : ''} ${locked ? 'locked' : ''}`}>
        <textarea value={draft} disabled={locked} onChange={event => dispatch({ type: 'DRAFT', round, value: event.target.value })} placeholder={round === 1 ? '写一句有点“标准答案味”的话……' : round === 2 ? '把你真正想说的话写下来……' : '写一个值得题主回应的问题……'} />
        <span className={count > 50 ? 'over' : ''}>{count}/50</span>
      </label>
      {error && <p className="field-error">{error}</p>}
      {locked ? <div className="locked-submit"><Check size={18} /><span><b>已确认并锁定</b>公开前其他席位看不到你的正文。</span></div> : <p className="privacy-line"><Eye size={15} />确认后锁定；本阶段结束时四条内容才会同时公开。</p>}
      <div className="screen-actions">
        {!locked ? <PrimaryButton onClick={() => dispatch({ type: 'SUBMIT', round })} disabled={Boolean(error) || !draft}>确认提交</PrimaryButton> : <PrimaryButton onClick={() => dispatch({ type: 'ADVANCE', from: state.phase })}>进入统一公开</PrimaryButton>}
      </div>
    </section>
  </GamePage>
}

const publicNext: Record<RoundNumber, string> = { 1: '开始身份指认', 2: '开始评论评选', 3: '开始问题评选' }

function PublicScreen({ state, round, dispatch }: { state: GameState; round: RoundNumber; dispatch: React.Dispatch<Parameters<typeof gameReducer>[1]> }) {
  return <GamePage state={state} sidebar={<><SidePost showCondition={round === 3} /><PublishedHistory state={state} through={round - 1} /><aside className="side-card"><span className="side-kicker">统一公开</span><p>四条内容在同一阶段出现，不显示谁先提交，也不展示输入状态。</p></aside></>}>
    <section className="content-card public-screen" data-screen={`round-${round}-public`}>
      <header className="round-heading"><span className="eyebrow">{ROUND_COPY[round].kicker} · 同时公开</span><h1>四个席位都写了什么？</h1><p>先完整看一遍。四张卡片的尺寸和视觉权重完全一致。</p></header>
      <div className="submission-grid">
        {SEATS.map(seat => <article key={seat} className="submission-card published"><div className="submission-author"><Character seat={seat} outfit={state.outfitBySeat[seat]} size="small" current={seat === state.userSeat} /></div><p>{state.submissions[round][seat]}</p>{seat === state.userSeat && <span className="self-chip">你的内容</span>}</article>)}
      </div>
      <div className="screen-actions"><PrimaryButton onClick={() => dispatch({ type: 'ADVANCE', from: state.phase })}>{publicNext[round]}</PrimaryButton></div>
    </section>
  </GamePage>
}

const voteMeta: Record<BallotType, { title: string; subtitle: string; round: RoundNumber; button: string; next: string }> = {
  round1Identity: { title: '谁背后真正是 AI？', subtitle: '这是身份竞猜。选一个其他席位，确认后不能修改。', round: 1, button: '确认指认', next: '进入第二轮' },
  round2Quality: { title: '哪条评论最值得你在原帖下点赞？', subtitle: '这是内容评选，不是身份竞猜。', round: 2, button: '确认选择', next: '进入第三轮' },
  round3Quality: { title: '哪个问题最值得题主回应？', subtitle: '先只评问题质量，下一页再猜身份。', round: 3, button: '确认问题票', next: '进入最终身份指认' },
  finalIdentity: { title: '看完三轮，你现在认为谁是 AI？', subtitle: '这是独立的最终身份票，不会改写上一页的问题质量票。', round: 3, button: '确认最终指认', next: '揭晓 AI' },
}

function VoteScreen({ state, ballot, dispatch }: { state: GameState; ballot: BallotType; dispatch: React.Dispatch<Parameters<typeof gameReducer>[1]> }) {
  const meta = voteMeta[ballot]
  const selected = state.selections[ballot]
  const lockedTarget = state.ballots[ballot][state.userSeat]
  return <GamePage state={state} sidebar={<><SidePost showCondition={meta.round === 3} /><PublishedHistory state={state} through={meta.round - 1} /><aside className="side-card vote-reminder"><span className="side-kicker">投票提醒</span><p>{meta.subtitle}</p><div><LockKeyhole size={15} />确认后锁定</div><div><Users size={15} />不能投自己</div></aside></>}>
    <section className="content-card vote-screen" data-screen={ballot}>
      <header className="round-heading"><span className="eyebrow">{ROUND_COPY[meta.round].kicker} · 内容已统一公开</span><h1>{meta.title}</h1><p>{meta.subtitle}</p></header>
      <div className="submission-grid">
        {SEATS.map(seat => {
          const isSelf = seat === state.userSeat
          const isSelected = (lockedTarget ?? selected) === seat
          return <button key={seat} className={`submission-card ${isSelected ? 'selected' : ''} ${isSelf ? 'self' : ''}`} disabled={isSelf || Boolean(lockedTarget)} onClick={() => dispatch({ type: 'SELECT', ballot, seat })}>
            <div className="submission-author"><Character seat={seat} outfit={state.outfitBySeat[seat]} size="small" current={isSelf} /><span className="select-indicator">{isSelected ? <Check size={16} /> : ''}</span></div>
            <p>{state.submissions[meta.round][seat]}</p>
            {isSelf && <span className="self-chip">你的内容 · 不可自投</span>}
          </button>
        })}
      </div>
      <div className="screen-actions sticky-mobile-action">
        {!lockedTarget ? <PrimaryButton onClick={() => dispatch({ type: 'LOCK_VOTE', ballot })} disabled={!selected}>{meta.button}</PrimaryButton> : <><span className="vote-locked"><Check size={16} />已锁定：席位 {lockedTarget}</span><PrimaryButton onClick={() => dispatch({ type: 'ADVANCE', from: state.phase })}>{meta.next}</PrimaryButton></>}
      </div>
    </section>
  </GamePage>
}

function Reveal({ state, dispatch }: { state: GameState; dispatch: React.Dispatch<Parameters<typeof gameReducer>[1]> }) {
  const guess = state.ballots.finalIdentity[state.userSeat]
  const correct = guess === state.aiSeat
  return <GamePage state={state}>
    <section className="content-card reveal-card" data-screen="reveal">
      <span className="eyebrow">最终指认已全部锁定</span><h1>AI 是席位 {state.aiSeat}</h1>
      <p className={`guess-result ${correct ? 'correct' : 'wrong'}`}>{correct ? '你猜对了！最终识破 +3 分。' : `你投给了 ${guess}，这次猜错了。`}</p>
      <CharacterGrid state={state} large reveal />
      <p className="muted-copy">另外三席只展示本局匿名席位，不公开真人资料。</p>
      <PrimaryButton onClick={() => dispatch({ type: 'ADVANCE', from: state.phase })}>查看本局结算</PrimaryButton>
    </section>
  </GamePage>
}

function RelationDrawer({ card, state, onClose }: { card: RelationCardData; state: GameState; onClose: () => void }) {
  const seat = card.otherSeat
  return <div className="drawer-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <aside className="relation-drawer" role="dialog" aria-modal="true" aria-label={`回看席位 ${seat} 的本局内容`}>
      <button className="modal-close" onClick={onClose} aria-label="关闭"><X size={20} /></button>
      <div className="drawer-character"><Character seat={seat} outfit={state.outfitBySeat[seat]} size="medium" /><div><span>匿名席位 {seat}</span><h2>{card.title}</h2></div></div>
      <p className="drawer-detail">{card.detail}</p>
      <div className="round-review">
        {[1, 2, 3].map(round => <article key={round}><span>{ROUND_COPY[round as RoundNumber].kicker}</span><p>{state.submissions[round as RoundNumber][seat]}</p></article>)}
      </div>
      <div className="evidence-box"><b>本卡依据</b>{card.evidence.map(item => <span key={item}><Check size={13} />{item}</span>)}</div>
    </aside>
  </div>
}

function Settlement({ state, dispatch }: { state: GameState; dispatch: React.Dispatch<Parameters<typeof gameReducer>[1]> }) {
  const ballots = completeBallots(state)
  const scores = calculateScores(state.aiSeat, ballots)
  const userScore = scores.find(item => item.seat === state.userSeat)!
  const achievements = achievementsFor(userScore, scores)
  const relations = generateRelationCards(state.userSeat, state.aiSeat, ballots)
  const [drawer, setDrawer] = useState<RelationCardData | null>(null)
  const [copied, setCopied] = useState<RoundNumber | null>(null)
  const [copyError, setCopyError] = useState<string | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const copyCandidate = async (round: 2 | 3) => {
    const base = state.submissions[round][state.userSeat] ?? ''
    const text = round === 3 ? `如果题主每周可居家办公三天，只需要去公司两天，我想问：${base}` : base
    try {
      await navigator.clipboard.writeText(text)
      setCopyError(null)
      setCopied(round)
      window.setTimeout(() => setCopied(null), 1400)
    } catch {
      setCopyError('复制失败，请检查浏览器的剪贴板权限后重试。')
    }
  }
  if (!state.gameValid) return <GamePage state={state}><section className="content-card invalid-card"><Info size={34} /><h1>本局未完成</h1><p>{state.invalidReason}</p><SecondaryButton onClick={() => dispatch({ type: 'RESET' })}>返回活动首页</SecondaryButton></section></GamePage>
  return <GamePage state={state}>
    <div className="settlement-page" data-screen="settlement">
      <section className="content-card settlement-hero"><span className="eyebrow">本局有效 · 已按 gameId 结算</span><div><div><h1>你获得 {userScore.total} 分</h1><p>席位 {state.userSeat} · 真人排行榜第 {scores.findIndex(item => item.seat === state.userSeat) + 1} 名</p></div><Trophy size={48} /></div></section>
      <section className="content-card score-section"><div className="section-title"><div><span className="eyebrow">只统计三名真人选票</span><h2>本局积分排行</h2></div><span className="max-score">满分 15</span></div>
        <div className="score-table"><div className="score-row head"><span>排名 / 席位</span><span>反串+初识</span><span>评论</span><span>问题</span><span>终识</span><span>总分</span></div>{scores.map((score, index) => <div className={`score-row ${score.seat === state.userSeat ? 'mine' : ''}`} key={score.seat}><span><b>{index + 1}</b><Character seat={score.seat} outfit={state.outfitBySeat[score.seat]} size="small" current={score.seat === state.userSeat} /></span><span>{score.masquerade + score.firstDetect}</span><span>{score.comment}</span><span>{score.question}</span><span>{score.finalDetect}</span><strong>{score.total}</strong></div>)}</div>
        <div className="ai-summary"><Character seat={state.aiSeat} outfit={state.outfitBySeat[state.aiSeat]} size="small" revealedAi /><span>AI 单独展示，不进入真人排行榜，也不参与真人计分。</span></div>
      </section>
      <section className="content-card achievements-section"><div className="section-title"><div><span className="eyebrow">确定性条件生成</span><h2>本局成就</h2></div><span className="index-note">入机指数：记录积累中（不足 10 局）</span></div><div className="achievement-list">{achievements.map((item, index) => <div key={item}><span>{index === achievements.length - 1 ? <Crown size={21} /> : <Trophy size={19} />}</span><b>{item}</b></div>)}</div></section>
      <section className="content-card relations-section"><div className="section-title"><div><span className="eyebrow">基于本局真实选票 · 不影响积分</span><h2>你和本局玩家的小故事</h2></div></div>{relations.length ? <div className="relation-grid">{relations.map(card => <article key={card.id} className={`relation-card relation-${card.type}`}><div className="relation-people"><Character seat={state.userSeat} outfit={state.outfitBySeat[state.userSeat]} size="small" current /><i /><Character seat={card.otherSeat} outfit={state.outfitBySeat[card.otherSeat]} size="small" /></div><h3>{card.title}</h3><p>{card.detail}</p><button onClick={() => setDrawer(card)}>看看 TA 刚才写了什么</button></article>)}</div> : <div className="neutral-recap">这一局，你们围绕同一篇帖子留下了这些评论。</div>}</section>
      <section className="content-card candidates-section"><div className="section-title"><div><span className="eyebrow">仅本人第二、三轮内容</span><h2>带走你的评论与问题</h2></div></div><div className="candidate-grid"><article><span>第二轮 · 认真评论</span><p>{state.submissions[2][state.userSeat]}</p><button onClick={() => copyCandidate(2)}>{copied === 2 ? <Check size={16} /> : <Copy size={16} />}{copied === 2 ? '已复制' : '复制我的评论'}</button></article><article><span>第三轮 · 提问</span><p>{state.submissions[3][state.userSeat]}</p><small>复制时会自动带上“每周居家三天”的游戏假设前提。</small><button onClick={() => copyCandidate(3)}>{copied === 3 ? <Check size={16} /> : <Copy size={16} />}{copied === 3 ? '已复制' : '复制我的问题'}</button></article></div>{copyError && <p className="field-error">{copyError}</p>}<div className="final-actions"><SecondaryButton onClick={() => setReviewOpen(true)}>回看本题</SecondaryButton><PrimaryButton onClick={() => dispatch({ type: 'REMATCH' })}><RotateCcw size={17} />再来一局</PrimaryButton></div><p className="no-publish"><Clipboard size={14} />这里只复制到剪贴板，不会显示假的“已发布到知乎”。</p></section>
    </div>{drawer && <RelationDrawer card={drawer} state={state} onClose={() => setDrawer(null)} />}{reviewOpen && <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && setReviewOpen(false)}><article className="rules-modal review-post" role="dialog" aria-modal="true" aria-label="回看本题"><button className="modal-close" onClick={() => setReviewOpen(false)} aria-label="关闭回看"><X size={20} /></button><span className="eyebrow">原帖摘录</span><h2>{POST.title}</h2><blockquote>{POST.excerpt}</blockquote><div className="new-condition"><span>第三轮游戏假设</span><strong>{POST.newCondition}</strong></div><PrimaryButton onClick={() => setReviewOpen(false)}>回到结算</PrimaryButton></article></div>}
  </GamePage>
}

export default function GameApp() {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadGame)
  const [rulesOpen, setRulesOpen] = useState(false)
  useEffect(() => {
    saveGame(state)
  }, [state])
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [state.phase])
  useEffect(() => {
    const timer = window.setInterval(() => dispatch({ type: 'TICK' }), 1000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    if (!state.notice) return
    const timer = window.setTimeout(() => dispatch({ type: 'CLEAR_NOTICE' }), 3500)
    return () => window.clearTimeout(timer)
  }, [state.notice])

  const screen = useMemo(() => {
    switch (state.phase) {
      case 'landing': return <Landing state={state} onStart={() => dispatch({ type: 'START' })} onRules={() => setRulesOpen(true)} />
      case 'lobby': return <Lobby state={state} onReady={() => dispatch({ type: 'READY' })} />
      case 'reading': return <Reading state={state} onNext={() => dispatch({ type: 'ADVANCE', from: state.phase })} />
      case 'round1Write': return <WritingScreen state={state} round={1} dispatch={dispatch} />
      case 'round1Public': return <PublicScreen state={state} round={1} dispatch={dispatch} />
      case 'round1Vote': return <VoteScreen state={state} ballot="round1Identity" dispatch={dispatch} />
      case 'round2Write': return <WritingScreen state={state} round={2} dispatch={dispatch} />
      case 'round2Public': return <PublicScreen state={state} round={2} dispatch={dispatch} />
      case 'round2Vote': return <VoteScreen state={state} ballot="round2Quality" dispatch={dispatch} />
      case 'round3Write': return <WritingScreen state={state} round={3} dispatch={dispatch} />
      case 'round3Public': return <PublicScreen state={state} round={3} dispatch={dispatch} />
      case 'round3QualityVote': return <VoteScreen state={state} ballot="round3Quality" dispatch={dispatch} />
      case 'finalIdentityVote': return <VoteScreen state={state} ballot="finalIdentity" dispatch={dispatch} />
      case 'reveal': return <Reveal state={state} dispatch={dispatch} />
      case 'settlement': return <Settlement state={state} dispatch={dispatch} />
    }
  }, [state])

  return <>
    <GameHeader phase={state.phase} onRules={() => setRulesOpen(true)} onReset={() => dispatch({ type: 'RESET' })} />
    {screen}
    {state.notice && <div className="toast" role="status">{state.notice}</div>}
    {rulesOpen && <RulesModal onClose={() => setRulesOpen(false)} />}
    <DemoControls phase={state.phase} seconds={state.secondsLeft} paused={state.paused} speed={state.speed} onPause={() => dispatch({ type: 'TOGGLE_PAUSE' })} onSpeed={() => dispatch({ type: 'TOGGLE_SPEED' })} onNext={() => dispatch({ type: 'ADVANCE', from: state.phase })} onReset={() => dispatch({ type: 'RESET' })} />
  </>
}
