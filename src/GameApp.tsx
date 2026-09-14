import { Check, ChevronDown, Clipboard, Clock3, Copy, Crown, Eye, FileText, Info, LockKeyhole, RotateCcw, Sparkles, Trophy, Users, X } from 'lucide-react'
import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Character } from './components/game/Character'
import { DemoControls } from './components/game/DemoControls'
import { GameHeader } from './components/game/GameHeader'
import { CONTENT_LABELS, LANDING_COPY, PHASE_ORDER, ROUNDS, ROUND_TOPICS, SEATS } from './game/data'
import { generateGameContent } from './game/ai'
import { countVisibleCharacters, validateSubmission } from './game/graphemes'
import { completeBallots, contentForAuthor, gameReducer } from './game/machine'
import { localVoteService } from './game/mockService'
import { achievementsFor, calculateScores, humanSeats } from './game/scoring'
import { loadGame, saveGame } from './game/storage'
import type { ContentId, GamePhase, GameState, RoundNumber, SeatId } from './game/types'

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
      <span className="eyebrow">约 9 分钟 · 3 位真人，1 个 AI</span>
      <h2 id="rules-title">三轮，都来猜 AI</h2>
      <ol className="rule-steps">
        <li><strong>1</strong><div><b>评论《牛来》</b><span>可以装得像 AI，也可以顺着题目玩梗；写完猜一次。</span></div></li>
        <li><strong>2</strong><div><b>聊聊 duo</b><span>解释、评论或质疑都可以；内容重新打乱，再猜一次。</span></div></li>
        <li><strong>3</strong><div><b>围绕 #西游记 提问</b><span>只问一个问题；最后再从四个问题里找出 AI。</span></div></li>
      </ol>
      <div className="rules-score"><b>每轮最多 5 分，整局满分 15 分</b><span>猜中 AI +2 分；被误认票数最高的真人 +3 分。若正票并列最高，并列者都得 +3 分；没人被误认则不发这 3 分。</span></div>
      <p className="muted-copy">三轮写作各 120 秒；前两轮最多 50 字，第三轮最多 30 字。每轮只投一票，不能投自己，投出后不能改。</p>
      <PrimaryButton onClick={onClose}>知道了</PrimaryButton>
    </section>
  </div>
}

function CharacterGrid({ state, large = false }: { state: GameState; large?: boolean }) {
  return <div className={`character-grid ${large ? 'large' : ''}`}>
    {SEATS.map(seat => <Character key={seat} seat={seat} outfit={state.outfitBySeat[seat]} size={large ? 'large' : 'medium'} current={seat === state.userSeat} />)}
  </div>
}

function Landing({ onStart, onRules, state }: { onStart: () => void; onRules: () => void; state: GameState }) {
  return <main className="landing-page" data-screen="landing">
    <section className="hero-section">
      <div className="hero-copy">
        <span className="eyebrow"><Sparkles size={15} />{LANDING_COPY.eyebrow}</span>
        <h1>{LANDING_COPY.titleTop}<br />{LANDING_COPY.titleBottom}</h1>
        <h2>{LANDING_COPY.subtitle}</h2>
        <p>{LANDING_COPY.description}</p>
        <div className="hero-actions"><PrimaryButton onClick={onStart}>{LANDING_COPY.primaryAction}</PrimaryButton><SecondaryButton onClick={onRules}>{LANDING_COPY.secondaryAction}</SecondaryButton></div>
      </div>
      <div className="hero-characters" aria-label="四个游戏角色"><CharacterGrid state={state} large /></div>
    </section>
    <section className="topic-preview topic-preview-multiple">
      <div className="topic-preview-icon"><FileText size={21} /></div>
      <div><span>{LANDING_COPY.topicLabel}</span><div className="topic-preview-list">{ROUNDS.map(round => <b key={round}>{round}. {ROUND_TOPICS[round].title}</b>)}</div></div>
      <span className="topic-tag">三轮三题</span>
    </section>
  </main>
}

function StageProgress({ phase }: { phase: GamePhase }) {
  const active = PHASE_ORDER.indexOf(phase)
  const steps = [['准备', 0], ['第一轮', 1], ['第二轮', 4], ['第三轮', 7], ['总成绩', 10]] as const
  const currentStep = steps.reduce((result, [, index], stepIndex) => active >= index ? stepIndex : result, 0)
  return <div className="stage-progress">
    {steps.map(([label], stepIndex) => <div key={label} className={`${stepIndex <= currentStep ? 'done' : ''} ${stepIndex === currentStep ? 'current' : ''}`}><i>{stepIndex < currentStep ? <Check size={12} /> : stepIndex + 1}</i><span>{label}</span></div>)}
  </div>
}

function GamePage({ state, children, sidebar }: { state: GameState; children: React.ReactNode; sidebar?: React.ReactNode }) {
  return <main className="game-page"><StageProgress phase={state.phase} /><div className={`game-columns ${sidebar ? '' : 'single'}`}><div>{children}</div>{sidebar && <div className="game-sidebar">{sidebar}</div>}</div></main>
}

function Lobby({ state, onReady, onRetry }: { state: GameState; onReady: () => void; onRetry: () => void }) {
  return <GamePage state={state} sidebar={<><aside className="side-card"><span className="side-kicker">本局流程</span><p>每轮先读题，再用 120 秒作答、40 秒从四条匿名内容里找 AI。</p><p>前两轮投票后直接进入下一轮，三轮结束后一起揭晓。</p></aside><aside className="side-card"><span className="side-kicker">匿名规则</span><p>衣服和席位整局不变，但每轮内容编号都会重新打乱。</p></aside></>}>
    <section className="content-card lobby-card" data-screen="lobby">
      <span className="eyebrow">开局前</span><h1>认一下你的角色</h1>
      <p className="lead">记住你的字母和衣服。这局里，你一直是 {state.userSeat}。</p>
      <CharacterGrid state={state} large />
      <div className="lobby-actions">
        {state.aiContentStatus === 'error' && <p className="lobby-error" role="alert">内容暂时无法载入，请重试。</p>}
        <div><PrimaryButton onClick={onReady} disabled={state.aiContentStatus !== 'ready'}>开始第一轮</PrimaryButton>{state.aiContentStatus === 'error' && <SecondaryButton onClick={onRetry}>重试</SecondaryButton>}</div>
      </div>
    </section>
  </GamePage>
}

function TopicAside({ round }: { round: RoundNumber }) {
  const topic = ROUND_TOPICS[round]
  const material = topic.context.trim()
  const collapsible = countVisibleCharacters(material) > 88
  return <aside className="side-card post-side-card">
    <span className="side-kicker">{round === 3 ? '本轮主题' : '本轮题目'}</span>
    <h3>{topic.title}</h3>
    {material && (collapsible
      ? <details className="topic-material-details"><summary><span className="when-closed">展开全文</span><span className="when-open">收起</span><ChevronDown size={15} /></summary><p>{material}</p></details>
      : <p className="topic-material-copy">{material}</p>)}
    {round === 3 && <p className="theme-instruction">围绕这个主题，提一个问题。</p>}
    <div className="source-chip"><FileText size={14} />{topic.sourceType}</div>
  </aside>
}

function PublishedHistory({ state, through }: { state: GameState; through: number }) {
  if (through < 1) return null
  return <aside className="side-card published-history"><details><summary>看看前面几轮 <ChevronDown size={15} /></summary>{ROUNDS.filter(round => round <= through).map(round => <section key={round}><b>{ROUND_TOPICS[round].kicker}</b>{state.contentSlots[round].map(slot => <p key={slot.contentId}><strong>{CONTENT_LABELS[slot.contentId]}</strong><span>{state.submissions[round][slot.authorSeat]}</span></p>)}</section>)}</details></aside>
}

function RoundHeader({ round, secondsLeft }: { round: RoundNumber; secondsLeft: number }) {
  const topic = ROUND_TOPICS[round]
  const taskTitle = round === 3 ? '提出一个问题' : '写下你的评论'
  const taskDescription = round === 3
    ? '选一个你真想知道的点，一次问清一件事。'
    : topic.task
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = String(secondsLeft % 60).padStart(2, '0')
  return <>
    <header className="round-heading"><span className="eyebrow">{topic.kicker}</span><h1>{taskTitle}</h1><p>{taskDescription}</p></header>
    <div className="writing-status"><span><Clock3 size={16} />作答时间 <strong>{minutes}:{seconds}</strong></span><span>{topic.contentKind}最多 {topic.maxChars} 字</span></div>
  </>
}

function ReadingScreen({ state, round, dispatch }: { state: GameState; round: RoundNumber; dispatch: React.Dispatch<Parameters<typeof gameReducer>[1]> }) {
  const topic = ROUND_TOPICS[round]
  const material = topic.context.trim()
  const roundName = ['一', '二', '三'][round - 1]
  return <GamePage state={state}>
    <section className={`content-card round-reading-card ${round === 3 ? 'theme-reading-card' : ''}`} data-screen={`round-${round}-read`}>
      <header><span className="eyebrow">第{roundName}轮 · {round === 3 ? '看主题' : '看题目'}</span><span className="reading-type">{round === 3 ? '本轮主题' : topic.sourceType}</span></header>
      <div className="reading-topic-body">
        <h1>{topic.title}</h1>
        {material && <div className="reading-material"><p>{material}</p></div>}
        {round === 3 && <p className="reading-theme-task">围绕这个主题，提一个问题。</p>}
      </div>
      <div className="reading-actions"><PrimaryButton onClick={() => dispatch({ type: 'START_WRITING', round })}>{round === 3 ? '开始提问' : '读完了，开始作答'}</PrimaryButton></div>
    </section>
  </GamePage>
}

function WritingScreen({ state, round, dispatch }: { state: GameState; round: RoundNumber; dispatch: React.Dispatch<Parameters<typeof gameReducer>[1]> }) {
  const topic = ROUND_TOPICS[round]
  const draft = state.drafts[round]
  const count = countVisibleCharacters(draft)
  const locked = Boolean(state.submissions[round][state.userSeat])
  const error = !locked && draft.length > 0 ? validateSubmission(draft, topic.maxChars) : null
  return <GamePage state={state} sidebar={<><TopicAside round={round} /><aside className="side-card hint-card"><span className="side-kicker">可以从这里想</span>{topic.hints.map(item => <span key={item}>{item}</span>)}</aside>{round > 1 && <PublishedHistory state={state} through={round - 1} />}</>}>
    <section className="content-card writing-card" data-screen={`round-${round}-write`}>
      <RoundHeader round={round} secondsLeft={state.secondsLeft} />
      <label className={`composer ${error ? 'has-error' : ''} ${locked ? 'locked' : ''}`}>
        <textarea value={draft} disabled={locked} onChange={event => dispatch({ type: 'DRAFT', round, value: event.target.value })} placeholder={topic.placeholder} />
        <span className={count > topic.maxChars ? 'over' : ''}>{count}/{topic.maxChars}</span>
      </label>
      {error && <p className="field-error">{error}</p>}
      {locked ? <div className="locked-submit"><Check size={18} /><span><b>你已提交</b>倒计时结束后一起看大家写的内容。</span></div> : <p className="privacy-line"><Eye size={15} />提交后不能修改；不会提前公开谁先写完。</p>}
      {!locked && <div className="screen-actions sticky-mobile-action"><PrimaryButton onClick={() => dispatch({ type: 'SUBMIT', round })} disabled={Boolean(error) || !draft}>提交{topic.contentKind}</PrimaryButton></div>}
    </section>
  </GamePage>
}

function AnonymousAvatar({ label }: { label: string }) {
  return <div className="anonymous-avatar" aria-hidden="true"><img src="/assets/characters/liukanshan-official-reference.png" alt="" /><strong>{label}</strong></div>
}

function VoteScreen({ state, round, dispatch }: { state: GameState; round: RoundNumber; dispatch: React.Dispatch<Parameters<typeof gameReducer>[1]> }) {
  const topic = ROUND_TOPICS[round]
  const lockedTarget = state.ballots[round][state.userSeat]
  const ownContentId = contentForAuthor(state.contentSlots[round], state.userSeat)!
  const [pendingTarget, setPendingTarget] = useState<ContentId | null>(null)
  const [voteError, setVoteError] = useState<string | null>(null)

  useEffect(() => {
    setPendingTarget(null)
    setVoteError(null)
  }, [round, state.gameId])

  const castVote = async (contentId: ContentId) => {
    if (contentId === ownContentId || lockedTarget || pendingTarget) return
    setPendingTarget(contentId)
    setVoteError(null)
    try {
      const receipt = await localVoteService.submitVote({ gameId: state.gameId, round, voter: state.userSeat, targetContentId: contentId, ownContentId })
      dispatch({ type: 'CAST_VOTE', round, contentId: receipt.targetContentId })
    } catch (error) {
      setVoteError(error instanceof Error ? error.message : '没投成功，请重试。')
    } finally {
      setPendingTarget(null)
    }
  }

  return <GamePage state={state} sidebar={<><TopicAside round={round} />{round > 1 && <PublishedHistory state={state} through={round - 1} />}<aside className="side-card vote-reminder"><span className="side-kicker">投票规则</span><div><LockKeyhole size={15} />点选就投票，投出后不能改</div><div><Users size={15} />不能投自己写的内容</div></aside></>}>
    <section className="content-card vote-screen" data-screen={`round-${round}-vote`}>
      <header className="round-heading"><span className="eyebrow">{topic.kicker} · 猜 AI</span><h1>{topic.voteTitle}</h1><p>本轮内容已匿名打乱。点选后不能更改。</p></header>
      <div className="submission-grid anonymous-grid">
        {state.contentSlots[round].map(slot => {
          const isSelf = slot.authorSeat === state.userSeat
          const isSelected = lockedTarget === slot.contentId
          const isPending = pendingTarget === slot.contentId
          const label = CONTENT_LABELS[slot.contentId]
          return <button key={slot.contentId} className={`submission-card anonymous-card ${isSelected ? 'selected' : ''} ${isPending ? 'submitting' : ''} ${isSelf ? 'self' : ''}`} disabled={isSelf || Boolean(lockedTarget) || Boolean(pendingTarget)} aria-label={isSelf ? `内容${label}，你写的，不能投票` : `投给内容${label}，认为它是 AI 写的`} aria-pressed={isSelected} onClick={() => castVote(slot.contentId)}>
            <div className="anonymous-card-head"><AnonymousAvatar label={label} /><span className="select-indicator">{isSelected ? <Check size={16} /> : ''}</span></div>
            <p>{state.submissions[round][slot.authorSeat]}</p>
            {isSelf && <span className="self-chip">你写的 · 不能投自己</span>}
            {isSelected && <span className="vote-chip">已投</span>}
            {isPending && <span className="vote-chip pending">正在投票…</span>}
          </button>
        })}
      </div>
      {lockedTarget && <div className="vote-status success"><Check size={17} /><div><strong>你投给了 {CONTENT_LABELS[lockedTarget]}。</strong><span>{round < 3 ? '投好了，倒计时结束后进入下一轮；你仍可以继续看内容。' : '投好了，倒计时结束后三轮一起揭晓；你仍可以继续看内容。'}</span></div></div>}
      {!lockedTarget && pendingTarget && <div className="vote-status"><Clock3 size={17} /><span>正在投票…</span></div>}
      {!lockedTarget && voteError && <div className="vote-status error" role="alert"><Info size={17} /><span>{voteError}</span></div>}
    </section>
  </GamePage>
}

function receivedVotes(state: GameState, round: RoundNumber, seat: SeatId): number {
  return humanSeats(state.aiSeat).filter(voter => {
    const contentId = state.ballots[round][voter]
    return contentId && state.contentSlots[round].find(slot => slot.contentId === contentId)?.authorSeat === seat
  }).length
}

function FinalRevealPanel({ state }: { state: GameState }) {
  return <section className="content-card final-reveal-card" data-screen="final-reveal">
    <div className="final-reveal-lead">
      <div><span className="eyebrow">最终揭晓</span><h1>{state.aiSeat} 是本局 AI</h1><p>三轮答案现在一起公开。每轮的匿名编号都不一样。</p></div>
      <Character seat={state.aiSeat} outfit={state.outfitBySeat[state.aiSeat]} size="large" revealedAi />
    </div>
    <div className="final-round-result-grid">
      {ROUNDS.map(round => {
        const aiContentId = contentForAuthor(state.contentSlots[round], state.aiSeat)!
        const userGuess = state.ballots[round][state.userSeat]
        const correct = userGuess === aiContentId
        return <article key={round}>
          <span>第{['一', '二', '三'][round - 1]}轮</span>
          <h2>{CONTENT_LABELS[aiContentId]} 是 AI 写的</h2>
          <p>{state.submissions[round][state.aiSeat]}</p>
          <strong className={correct ? 'correct' : 'wrong'}>{correct ? '你猜对了 · +2 分' : `你投给了 ${userGuess ? CONTENT_LABELS[userGuess] : '—'} · 未猜中`}</strong>
        </article>
      })}
    </div>
  </section>
}

function Settlement({ state, dispatch }: { state: GameState; dispatch: React.Dispatch<Parameters<typeof gameReducer>[1]> }) {
  const ballots = completeBallots(state)
  const scores = calculateScores(state.aiSeat, ballots, state.contentSlots)
  const userScore = scores.find(item => item.seat === state.userSeat)!
  const achievements = achievementsFor(userScore, scores)
  const [copied, setCopied] = useState<RoundNumber | null>(null)
  const [copyError, setCopyError] = useState<string | null>(null)

  const copyCandidate = async (round: RoundNumber) => {
    const text = state.submissions[round][state.userSeat] ?? ''
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

  const userTied = scores.filter(item => item.total === userScore.total).length > 1
  return <GamePage state={state}>
    <div className="settlement-page" data-screen="settlement">
      <FinalRevealPanel state={state} />
      <section className="content-card settlement-hero"><span className="eyebrow">总成绩</span><div><div><h1>你获得 {userScore.total} 分</h1><p>{userTied ? `你并列第 ${userScore.rank} 名` : `你获得了第 ${userScore.rank} 名`}</p></div><Trophy size={48} /></div></section>
      <section className="content-card score-section"><div className="section-title"><div><span className="eyebrow">三名真人排名</span><h2>本局积分</h2></div><span className="max-score">满分 15 分 · AI 不投票</span></div>
        <div className="score-table"><div className="score-row head"><span>排名 / 玩家</span><span>第一轮</span><span>第二轮</span><span>第三轮</span><span>总分</span></div>{scores.map(score => <div className={`score-row ${score.seat === state.userSeat ? 'mine' : ''}`} key={score.seat}><span><b>{score.rank}</b><Character seat={score.seat} outfit={state.outfitBySeat[score.seat]} size="small" current={score.seat === state.userSeat} /></span><span data-mobile-label="一">{score.rounds[1].total}</span><span data-mobile-label="二">{score.rounds[2].total}</span><span data-mobile-label="三">{score.rounds[3].total}</span><strong data-mobile-label="总">{score.total}</strong></div>)}</div>
        <div className="ai-summary"><Character seat={state.aiSeat} outfit={state.outfitBySeat[state.aiSeat]} size="small" revealedAi /><span>AI 只提供内容，不投票，也不进入真人排名。</span></div>
      </section>
      <section className="content-card achievements-section"><div className="section-title"><div><span className="eyebrow">按本局实际结果生成</span><h2>本局成就</h2></div></div><div className="achievement-list">{achievements.map((item, index) => <div key={item}><span>{index === achievements.length - 1 ? <Crown size={21} /> : <Trophy size={19} />}</span><b>{item}</b></div>)}</div></section>
      <section className="content-card recap-section"><div className="section-title"><div><span className="eyebrow">编号每轮都重新打乱</span><h2>三轮内容回看</h2></div></div><div className="full-round-recap">{ROUNDS.map(round => <details key={round}><summary><span>{ROUND_TOPICS[round].kicker}</span><b>{ROUND_TOPICS[round].title}</b><ChevronDown size={17} /></summary><div className="recap-grid">{state.contentSlots[round].map(slot => <article key={slot.contentId}><div><strong>{CONTENT_LABELS[slot.contentId]} · {slot.authorSeat}{slot.authorSeat === state.userSeat ? '（你）' : ''}</strong>{slot.authorSeat === state.aiSeat && <span>AI</span>}</div><p>{state.submissions[round][slot.authorSeat]}</p><small>收到 {receivedVotes(state, round, slot.authorSeat)} 张“AI”票</small></article>)}</div></details>)}</div></section>
      <section className="content-card candidates-section"><div className="section-title"><div><span className="eyebrow">你本局写下的内容</span><h2>复制我的内容</h2></div></div><div className="candidate-grid three">{ROUNDS.map(round => <article key={round}><span>第{['一', '二', '三'][round - 1]}轮 · {ROUND_TOPICS[round].contentKind}</span><p>{state.submissions[round][state.userSeat]}</p><button onClick={() => copyCandidate(round)}>{copied === round ? <Check size={16} /> : <Copy size={16} />}{copied === round ? '已复制' : `复制我的${ROUND_TOPICS[round].contentKind}`}</button></article>)}</div>{copyError && <p className="field-error">{copyError}</p>}<div className="final-actions"><PrimaryButton onClick={() => dispatch({ type: 'REMATCH' })}><RotateCcw size={17} />再来一局</PrimaryButton></div><p className="no-publish"><Clipboard size={14} />这里只复制文字，不会替你发布。</p></section>
    </div>
  </GamePage>
}

export default function GameApp() {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadGame)
  const [rulesOpen, setRulesOpen] = useState(false)
  const requestedAiGames = useRef(new Set<string>())
  const debugControlsEnabled = import.meta.env.DEV && new URLSearchParams(window.location.search).get('debug') === '1'
  const testNextEnabled = import.meta.env.DEV && state.phase !== 'landing' && state.phase !== 'lobby' && state.phase !== 'settlement'

  const advanceTestPhase = () => {
    if (state.phase === 'round1Read') return dispatch({ type: 'START_WRITING', round: 1 })
    if (state.phase === 'round2Read') return dispatch({ type: 'START_WRITING', round: 2 })
    if (state.phase === 'round3Read') return dispatch({ type: 'START_WRITING', round: 3 })
    dispatch({ type: 'PHASE_EXPIRED', from: state.phase })
  }

  useEffect(() => { saveGame(state) }, [state])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }) }, [state.phase])
  useEffect(() => {
    const timer = window.setInterval(() => dispatch({ type: 'TICK' }), 1000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    if (!state.notice) return
    const timer = window.setTimeout(() => dispatch({ type: 'CLEAR_NOTICE' }), 3500)
    return () => window.clearTimeout(timer)
  }, [state.notice])
  useEffect(() => {
    if (state.phase !== 'lobby' || state.aiContentStatus !== 'idle' || requestedAiGames.current.has(state.gameId)) return
    const gameId = state.gameId
    requestedAiGames.current.add(gameId)
    dispatch({ type: 'AI_CONTENT_REQUEST' })
    void generateGameContent()
      .then(content => dispatch({ type: 'AI_CONTENT_SUCCESS', gameId, content }))
      .catch(error => {
        requestedAiGames.current.delete(gameId)
        dispatch({ type: 'AI_CONTENT_FAILURE', gameId, message: error instanceof Error ? error.message : 'AI 内容准备失败，请重试。' })
      })
  }, [state.phase, state.aiContentStatus, state.gameId])

  const screen = useMemo(() => {
    switch (state.phase) {
      case 'landing': return <Landing state={state} onStart={() => dispatch({ type: 'START' })} onRules={() => setRulesOpen(true)} />
      case 'lobby': return <Lobby state={state} onReady={() => dispatch({ type: 'READY' })} onRetry={() => dispatch({ type: 'AI_CONTENT_RETRY' })} />
      case 'round1Read': return <ReadingScreen state={state} round={1} dispatch={dispatch} />
      case 'round1Write': return <WritingScreen state={state} round={1} dispatch={dispatch} />
      case 'round1Vote': return <VoteScreen key="round1" state={state} round={1} dispatch={dispatch} />
      case 'round2Read': return <ReadingScreen state={state} round={2} dispatch={dispatch} />
      case 'round2Write': return <WritingScreen state={state} round={2} dispatch={dispatch} />
      case 'round2Vote': return <VoteScreen key="round2" state={state} round={2} dispatch={dispatch} />
      case 'round3Read': return <ReadingScreen state={state} round={3} dispatch={dispatch} />
      case 'round3Write': return <WritingScreen state={state} round={3} dispatch={dispatch} />
      case 'round3Vote': return <VoteScreen key="round3" state={state} round={3} dispatch={dispatch} />
      case 'settlement': return <Settlement state={state} dispatch={dispatch} />
    }
  }, [state])

  return <>
    <GameHeader phase={state.phase} seconds={state.secondsLeft} onRules={() => setRulesOpen(true)} onReset={() => dispatch({ type: 'RESET' })} onTestNext={testNextEnabled ? advanceTestPhase : undefined} />
    {screen}
    {state.notice && <div className="toast" role="status">{state.notice}</div>}
    {rulesOpen && <RulesModal onClose={() => setRulesOpen(false)} />}
    {debugControlsEnabled && <DemoControls phase={state.phase} seconds={state.secondsLeft} paused={state.paused} speed={state.speed} onPause={() => dispatch({ type: 'TOGGLE_PAUSE' })} onSpeed={() => dispatch({ type: 'TOGGLE_SPEED' })} onEnd={() => dispatch({ type: 'PHASE_EXPIRED', from: state.phase })} onReset={() => dispatch({ type: 'RESET' })} />}
  </>
}
