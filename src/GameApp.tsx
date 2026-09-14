import { Check, ChevronDown, Clipboard, Clock3, Copy, Crown, ExternalLink, Eye, FileText, Info, LockKeyhole, MessageCircle, RotateCcw, Sparkles, Trophy, Users, X } from 'lucide-react'
import { useEffect, useMemo, useReducer, useState } from 'react'
import { Character } from './components/game/Character'
import { DemoControls } from './components/game/DemoControls'
import { GameHeader } from './components/game/GameHeader'
import { LANDING_COPY, PHASE_ORDER, POST, ROUND_COPY, SEATS, VOTE_COPY } from './game/data'
import { countVisibleCharacters, validateSubmission } from './game/graphemes'
import { completeBallots, gameReducer } from './game/machine'
import { localVoteService } from './game/mockService'
import { generateRelationCards } from './game/relations'
import { achievementsFor, calculateScores } from './game/scoring'
import { loadGame, saveGame } from './game/storage'
import { postSourceLabel, type InitialPost } from './game/posts'
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
      <span className="eyebrow">约 6 分钟 · 3 位真人，1 个 AI</span>
      <h2 id="rules-title">三轮，找出谁是人机</h2>
      <ol className="rule-steps">
        <li><strong>1</strong><div><b>全员装人机</b><span>故意写得像 AI，看看能骗过谁，再猜谁是真正的 AI。</span></div></li>
        <li><strong>2</strong><div><b>这次认真说</b><span>正常评论，只选你最想点赞的一条。</span></div></li>
        <li><strong>3</strong><div><b>这问题值得问</b><span>看完补充信息，提一个问题，选出你最想让题主回答的，再猜一次 AI。</span></div></li>
      </ol>
      <div className="rules-score"><b>最高 15 分</b><span>第一轮，每骗到一位真人 +1 分，猜中 AI +2 分；第二、三轮，你的评论或问题每获一位真人投票 +2 分；最后猜中 AI +3 分。</span></div>
      <p className="muted-copy">每条最多 50 字，不能投自己。点选卡片就会投票，投出后不能改。最后统一揭晓谁是 AI。</p>
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
        <span className="eyebrow"><Sparkles size={15} />{LANDING_COPY.eyebrow}</span>
        <h1>{LANDING_COPY.titleTop}<br />{LANDING_COPY.titleBottom}</h1>
        <h2>{LANDING_COPY.subtitle}</h2>
        <p>{LANDING_COPY.description}</p>
        <div className="hero-actions"><PrimaryButton onClick={onStart}>{LANDING_COPY.primaryAction}</PrimaryButton><SecondaryButton onClick={onRules}>{LANDING_COPY.secondaryAction}</SecondaryButton></div>
      </div>
      <div className="hero-characters" aria-label="四个游戏角色"><CharacterGrid state={state} large /></div>
    </section>
    <section className="topic-preview">
      <div><span>{LANDING_COPY.topicLabel}</span><h3>{state.post.title}</h3><p>{postSourceLabel(state.post)}</p></div>
      <span className="topic-tag">{({ opinion: '观点讨论', knowledge: '轻知识', story: '轻松故事' }[state.post.category])}</span>
    </section>
  </main>
}

function StageProgress({ phase }: { phase: GamePhase }) {
  const active = PHASE_ORDER.indexOf(phase)
  const steps = [
    ['准备', 0], ['看题目', 1], ['第一轮', 2], ['第二轮', 4], ['第三轮', 6], ['揭晓', 9], ['结算', 10],
  ] as const
  return <div className="stage-progress">
    {steps.map(([label, index], stepIndex) => <div key={label} className={active >= index ? 'done' : ''}><i>{active > index ? <Check size={12} /> : stepIndex + 1}</i><span>{label}</span></div>)}
  </div>
}

function Lobby({ state, onReady }: { state: GameState; onReady: () => void }) {
  return <GamePage state={state} sidebar={<LobbyAside state={state} />}>
    <section className="content-card lobby-card" data-screen="lobby">
      <span className="eyebrow">开局前</span><h1>认一下你的角色</h1>
      <p className="lead">记住你的字母和衣服，这局不会变。最后揭晓谁是 AI。</p>
      <CharacterGrid state={state} large />
      <div className="solo-notice"><Users size={20} /><div><strong>你是 {state.userSeat}</strong><span>这是单人试玩，其他三位的发言都是预先写好的，不是在线玩家。</span></div></div>
      <PrimaryButton onClick={onReady}>开始读题</PrimaryButton>
    </section>
  </GamePage>
}

function LobbyAside({ state }: { state: GameState }) {
  return <><SidePost post={state.post} /><aside className="side-card"><span className="side-kicker">本局编号</span><strong className="mono">{state.gameId}</strong><p>角色身份为本局预设数据，不代表在线用户或真实模型调用。</p></aside></>
}

function PostSource({ post }: { post: InitialPost }) {
  return <div className="answer-source"><div className="source-avatar">答</div><div><b>{postSourceLabel(post)}</b>{post.sourceUrl ? <><span>{post.author ?? '作者未提供'}{post.commentCount !== null ? ` · ${post.commentCount} 条评论` : ''}{post.voteCount !== null ? ` · ${post.voteCount} 赞同` : ''}</span><a href={post.sourceUrl} target="_blank" rel="noopener noreferrer">查看知乎原回答 ↗</a><span>当前展示文本预计 {post.readingSeconds} 秒读完{post.textKind === 'excerpt' ? ' · 摘录不代表原回答全文' : ''}</span></> : <span>本局原创情境内容，不对应真实作者、赞同数或原帖链接</span>}</div></div>
}

function SidePost({ post, showCondition = false }: { post: InitialPost; showCondition?: boolean }) {
  return <aside className="side-card post-side-card"><span className="side-kicker">本局帖子</span><h3>{post.title}</h3><p>{post.text}</p><div className="source-chip"><FileText size={14} />{postSourceLabel(post)}</div>{showCondition && <div className="condition-mini"><b>游戏假设</b>{POST.newCondition}</div>}</aside>
}

function PublishedHistory({ state, through }: { state: GameState; through: number }) {
  if (through < 1) return null
  return <aside className="side-card published-history"><details><summary>看看前面几轮 <ChevronDown size={15} /></summary>{([1, 2, 3] as RoundNumber[]).filter(round => round <= through).map(round => <section key={round}><b>{ROUND_COPY[round].kicker}</b>{SEATS.map(seat => <p key={seat}><strong>{seat}</strong>{state.submissions[round][seat]}</p>)}</section>)}</details></aside>
}

function GamePage({ state, children, sidebar }: { state: GameState; children: React.ReactNode; sidebar?: React.ReactNode }) {
  return <main className="game-page"><StageProgress phase={state.phase} /><div className={`game-columns ${sidebar ? '' : 'single'}`}><div>{children}</div>{sidebar && <div className="game-sidebar">{sidebar}</div>}</div></main>
}

function Reading({ state, onNext }: { state: GameState; onNext: () => void }) {
  return <GamePage state={state} sidebar={<aside className="side-card rules-side"><span className="side-kicker">这局要做什么</span><ol><li><b>装人机</b><span>写得像 AI，再猜一次</span></li><li><b>认真说</b><span>写评论，选一条</span></li><li><b>值得问</b><span>提一个问题，最后猜 AI</span></li></ol><details><summary>展开计分规则 <ChevronDown size={15} /></summary><p>被真人误认最多 2 分；首轮猜中 2 分；评论与问题各最多 4 分；最终猜中 3 分。</p></details></aside>}>
    <article className="content-card reading-card" data-screen="reading">
      <span className="eyebrow">先看看这道题</span><h1>{state.post.title}</h1>
      <PostSource post={state.post} />
      <blockquote>{state.post.text}</blockquote>
      <div className="reading-note"><LockKeyhole size={18} /><span>补充条件会在第三轮出现。</span></div>
      <PrimaryButton onClick={onNext}>开始第一轮</PrimaryButton>
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
  return <GamePage state={state} sidebar={<><SidePost post={state.post} showCondition={round === 3} />{round > 1 && <PublishedHistory state={state} through={round - 1} />}<aside className="side-card hint-card"><span className="side-kicker">不知道怎么写？</span>{ROUND_COPY[round].hints.map(item => <span key={item}>{item}</span>)}</aside></>}>
    <section className="content-card writing-card" data-screen={`round-${round}-write`}>
      <RoundHeader round={round} />
      {round === 2 && <div className="tone-shift"><MessageCircle size={18} /><span><b>反串结束。</b>这轮只看评论本身。</span></div>}
      {round === 3 && <div className="new-condition"><span>补充条件</span><strong>{POST.newCondition}</strong><p>这是本局补充情境。</p></div>}
      <label className={`composer ${error ? 'has-error' : ''} ${locked ? 'locked' : ''}`}>
        <textarea value={draft} disabled={locked} onChange={event => dispatch({ type: 'DRAFT', round, value: event.target.value })} placeholder={ROUND_COPY[round].placeholder} />
        <span className={count > 50 ? 'over' : ''}>{count}/50</span>
      </label>
      {error && <p className="field-error">{error}</p>}
      {locked ? <div className="locked-submit"><Check size={18} /><span><b>已提交</b>倒计时结束后，会自动进入投票。</span></div> : <p className="privacy-line"><Eye size={15} />提交后不能修改。倒计时结束后，一起看大家写了什么。</p>}
      {!locked && <div className="screen-actions"><PrimaryButton onClick={() => dispatch({ type: 'SUBMIT', round })} disabled={Boolean(error) || !draft}>提交</PrimaryButton></div>}
    </section>
  </GamePage>
}

function VoteScreen({ state, ballot, dispatch }: { state: GameState; ballot: BallotType; dispatch: React.Dispatch<Parameters<typeof gameReducer>[1]> }) {
  const meta = VOTE_COPY[ballot]
  const lockedTarget = state.ballots[ballot][state.userSeat]
  const [pendingTarget, setPendingTarget] = useState<SeatId | null>(null)
  const [voteError, setVoteError] = useState<string | null>(null)
  const finalReview = ballot === 'finalIdentity'
  const successCopy = lockedTarget
    ? ballot === 'round2Quality'
      ? `你选了 ${lockedTarget} 的评论。`
      : ballot === 'round3Quality'
        ? `你选了 ${lockedTarget} 的问题。`
        : `你投给了 ${lockedTarget}。`
    : ''
  const waitCopy = ballot === 'finalIdentity' ? '投好了，倒计时结束后揭晓。' : '投好了，倒计时结束后继续。'

  useEffect(() => {
    setPendingTarget(null)
    setVoteError(null)
  }, [ballot, state.gameId])

  const castVote = async (seat: SeatId) => {
    if (seat === state.userSeat || lockedTarget || pendingTarget) return
    setPendingTarget(seat)
    setVoteError(null)
    try {
      const receipt = await localVoteService.submitVote({ gameId: state.gameId, ballot, voter: state.userSeat, target: seat })
      dispatch({ type: 'CAST_VOTE', ballot, seat: receipt.target })
    } catch {
      setVoteError('没投成功，请重试。')
    } finally {
      setPendingTarget(null)
    }
  }

  return <GamePage state={state} sidebar={<><SidePost post={state.post} showCondition={meta.round === 3} />{!finalReview && <PublishedHistory state={state} through={meta.round - 1} />}<aside className="side-card vote-reminder"><span className="side-kicker">投票规则</span><div><LockKeyhole size={15} />点选就投票，投出后不能改</div><div><Users size={15} />不能投自己</div></aside></>}>
    <section className="content-card vote-screen" data-screen={ballot}>
      <header className="round-heading"><span className="eyebrow">{ROUND_COPY[meta.round].kicker} · 投票</span><h1>{meta.title}</h1><p>{meta.subtitle}</p></header>
      <div className="submission-grid">
        {SEATS.map(seat => {
          const isSelf = seat === state.userSeat
          const isSelected = lockedTarget === seat
          const isPending = pendingTarget === seat
          const actionLabel = isSelf
            ? '你写的，不能投自己'
            : ballot === 'round2Quality'
              ? `给 ${seat} 的评论投票`
              : ballot === 'round3Quality'
                ? `给 ${seat} 的问题投票`
                : `投给 ${seat}，认为 TA 是 AI`
          return <button key={seat} className={`submission-card ${isSelected ? 'selected' : ''} ${isPending ? 'submitting' : ''} ${isSelf ? 'self' : ''} ${finalReview ? 'final-review-card' : ''}`} disabled={isSelf || Boolean(lockedTarget) || Boolean(pendingTarget)} aria-label={actionLabel} aria-pressed={isSelected} onClick={() => castVote(seat)}>
            <div className="submission-author"><Character seat={seat} outfit={state.outfitBySeat[seat]} size="small" current={isSelf} /><span className="select-indicator">{isSelected ? <Check size={16} /> : ''}</span></div>
            {finalReview ? <div className="final-round-review">{([1, 2, 3] as RoundNumber[]).map(round => <div key={round}><span>{ROUND_COPY[round].kicker}</span><p>{state.submissions[round][seat]}</p></div>)}</div> : <p>{state.submissions[meta.round][seat]}</p>}
            {isSelf && <span className="self-chip">你写的 · 不能投自己</span>}
            {isSelected && <span className="vote-chip">已投</span>}
            {isPending && <span className="vote-chip pending">正在投票…</span>}
          </button>
        })}
      </div>
      {lockedTarget && <div className="vote-status success"><Check size={17} /><div><strong>{successCopy}</strong><span>{waitCopy}</span></div></div>}
      {!lockedTarget && pendingTarget && <div className="vote-status"><Clock3 size={17} /><span>正在投票…</span></div>}
      {!lockedTarget && voteError && <div className="vote-status error" role="alert"><Info size={17} /><span>{voteError}</span></div>}
    </section>
  </GamePage>
}

function Reveal({ state, dispatch }: { state: GameState; dispatch: React.Dispatch<Parameters<typeof gameReducer>[1]> }) {
  const guess = state.ballots.finalIdentity[state.userSeat]
  const correct = guess === state.aiSeat
  return <GamePage state={state}>
    <section className="content-card reveal-card" data-screen="reveal">
      <span className="eyebrow">身份揭晓</span><h1>原来 {state.aiSeat} 是 AI！</h1>
      <p className={`guess-result ${correct ? 'correct' : 'wrong'}`}>{correct ? '猜对了！+3 分' : `你选了 ${guess}，这次没猜中。`}</p>
      <CharacterGrid state={state} large reveal />
      <p className="muted-copy">大家仍然使用本局代号，不会公开个人资料。</p>
      <div className="reveal-actions">
        <a className="secondary-button source-link" href={state.post.sourceUrl ?? undefined}>去知乎看原帖<ExternalLink size={16} /></a>
        <PrimaryButton onClick={() => dispatch({ type: 'SHOW_SETTLEMENT' })}>看看这局成绩</PrimaryButton>
      </div>
    </section>
  </GamePage>
}

function RelationDrawer({ card, state, onClose }: { card: RelationCardData; state: GameState; onClose: () => void }) {
  const seat = card.otherSeat
  return <div className="drawer-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <aside className="relation-drawer" role="dialog" aria-modal="true" aria-label={`看看 ${seat} 这局写了什么`}>
      <button className="modal-close" onClick={onClose} aria-label="关闭"><X size={20} /></button>
      <div className="drawer-character"><Character seat={seat} outfit={state.outfitBySeat[seat]} size="medium" /><div><span>{seat} 的本局发言</span><h2>{card.title}</h2></div></div>
      <p className="drawer-detail">{card.detail}</p>
      <div className="round-review">
        {[1, 2, 3].map(round => <article key={round}><span>{ROUND_COPY[round as RoundNumber].kicker}</span><p>{state.submissions[round as RoundNumber][seat]}</p></article>)}
      </div>
      <div className="evidence-box"><b>当时怎么投的</b>{card.evidence.map(item => <span key={item}><Check size={13} />{item}</span>)}</div>
    </aside>
  </div>
}

function Settlement({ state, dispatch }: { state: GameState; dispatch: React.Dispatch<Parameters<typeof gameReducer>[1]> }) {
  const ballots = completeBallots(state)
  const scores = calculateScores(state.aiSeat, ballots)
  const userScore = scores.find(item => item.seat === state.userSeat)!
  const achievements = achievementsFor(userScore, scores)
  const relations = generateRelationCards(state.userSeat, state.aiSeat, ballots)
  const userRank = scores.filter(item => item.total > userScore.total).length + 1
  const userTied = scores.filter(item => item.total === userScore.total).length > 1
  const validGameCount = state.rematchIndex + 1
  const relationTypes = new Set(relations.map(card => card.type))
  const mistakeTypes = new Set(['mutualMistake', 'youMistook', 'theyMistook'])
  const relationTitle = relations.length > 0 && relations.every(card => mistakeTypes.has(card.type))
    ? '刚才谁认错了谁？'
    : relationTypes.size === 1 && relationTypes.has('sharedDetect')
      ? '你们都猜对了'
      : relationTypes.size === 1 && relationTypes.has('contentRecognition')
        ? '这几票，投给了谁？'
        : '这一局的小插曲'
  const [drawer, setDrawer] = useState<RelationCardData | null>(null)
  const [copied, setCopied] = useState<RoundNumber | null>(null)
  const [copyError, setCopyError] = useState<string | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const copyCandidate = async (round: 2 | 3) => {
    const base = state.submissions[round][state.userSeat] ?? ''
    const text = round === 3 ? `${POST.copyPrefix}${base}` : base
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
      <section className="content-card settlement-hero"><span className="eyebrow">本局结算</span><div><div><h1>你获得 {userScore.total} 分</h1><p>{userTied ? `你并列第 ${userRank} 名` : `你获得了第 ${userRank} 名`}</p></div><Trophy size={48} /></div></section>
      <section className="content-card score-section"><div className="section-title"><div><span className="eyebrow">AI 的票不计分</span><h2>本局积分排行</h2></div><span className="max-score">满分 15 分</span></div>
        <div className="score-table"><div className="score-row head"><span>排名 / 玩家</span><span>反串 / 第一轮猜 AI</span><span>评论</span><span>问题</span><span>最后猜 AI</span><span>总分</span></div>{scores.map(score => <div className={`score-row ${score.seat === state.userSeat ? 'mine' : ''}`} key={score.seat}><span><b>{scores.filter(item => item.total > score.total).length + 1}</b><Character seat={score.seat} outfit={state.outfitBySeat[score.seat]} size="small" current={score.seat === state.userSeat} /></span><span>{score.masquerade + score.firstDetect}</span><span>{score.comment}</span><span>{score.question}</span><span>{score.finalDetect}</span><strong>{score.total}</strong></div>)}</div>
        <div className="ai-summary"><Character seat={state.aiSeat} outfit={state.outfitBySeat[state.aiSeat]} size="small" revealedAi /><span>AI 不参与排名。</span></div>
      </section>
      <section className="content-card achievements-section"><div className="section-title"><div><span className="eyebrow">本局表现</span><h2>本局成就</h2></div><span className="index-note">入机指数：再玩几局就能看到了（已完成 {validGameCount}/10 局）</span></div><div className="achievement-list">{achievements.map((item, index) => <div key={item}><span>{index === achievements.length - 1 ? <Crown size={21} /> : <Trophy size={19} />}</span><b>{item}</b></div>)}</div></section>
      <section className="content-card relations-section"><div className="section-title"><h2>{relationTitle}</h2></div>{relations.length ? <div className="relation-grid">{relations.map(card => <article key={card.id} className={`relation-card relation-${card.type}`}><div className="relation-people"><Character seat={state.userSeat} outfit={state.outfitBySeat[state.userSeat]} size="small" current /><i /><Character seat={card.otherSeat} outfit={state.outfitBySeat[card.otherSeat]} size="small" /></div><h3>{card.title}</h3><p>{card.detail}</p><button onClick={() => setDrawer(card)}>看看 TA 刚才写了什么</button></article>)}</div> : <div className="neutral-recap">看看大家这局都写了什么</div>}</section>
      <section className="content-card candidates-section"><div className="section-title"><div><span className="eyebrow">你本局写下的内容</span><h2>把这两句带回评论区</h2></div></div><div className="candidate-grid"><article><span>第二轮 · 认真评论</span><p>{state.submissions[2][state.userSeat]}</p><button onClick={() => copyCandidate(2)}>{copied === 2 ? <Check size={16} /> : <Copy size={16} />}{copied === 2 ? '已复制' : '复制我的评论'}</button></article><article><span>第三轮 · 提问</span><p>{POST.copyPrefix}{state.submissions[3][state.userSeat]}</p><small>复制问题时，会附上第三轮的补充信息。</small><button onClick={() => copyCandidate(3)}>{copied === 3 ? <Check size={16} /> : <Copy size={16} />}{copied === 3 ? '已复制' : '复制我的问题'}</button></article></div>{copyError && <p className="field-error">{copyError}</p>}<div className="final-actions"><SecondaryButton onClick={() => setReviewOpen(true)}>回看本题</SecondaryButton><PrimaryButton onClick={() => dispatch({ type: 'REMATCH' })}><RotateCcw size={17} />再来一局</PrimaryButton></div><p className="no-publish"><Clipboard size={14} />复制后，可以去原帖粘贴并自行发布。</p></section>
    </div>{drawer && <RelationDrawer card={drawer} state={state} onClose={() => setDrawer(null)} />}{reviewOpen && <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && setReviewOpen(false)}><article className="rules-modal review-post" role="dialog" aria-modal="true" aria-label="回看本题"><button className="modal-close" onClick={() => setReviewOpen(false)} aria-label="关闭回看"><X size={20} /></button><span className="eyebrow">题目回顾</span><h2>{state.post.title}</h2><blockquote>{state.post.text}</blockquote><div className="new-condition"><span>第三轮补充条件</span><strong>{POST.newCondition}</strong></div><PrimaryButton onClick={() => setReviewOpen(false)}>回到结算</PrimaryButton></article></div>}
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
      case 'reading': return <Reading state={state} onNext={() => dispatch({ type: 'PHASE_EXPIRED', from: state.phase })} />
      case 'round1Write': return <WritingScreen state={state} round={1} dispatch={dispatch} />
      case 'round1Vote': return <VoteScreen key="round1Identity" state={state} ballot="round1Identity" dispatch={dispatch} />
      case 'round2Write': return <WritingScreen state={state} round={2} dispatch={dispatch} />
      case 'round2Vote': return <VoteScreen key="round2Quality" state={state} ballot="round2Quality" dispatch={dispatch} />
      case 'round3Write': return <WritingScreen state={state} round={3} dispatch={dispatch} />
      case 'round3QualityVote': return <VoteScreen key="round3Quality" state={state} ballot="round3Quality" dispatch={dispatch} />
      case 'finalIdentityVote': return <VoteScreen key="finalIdentity" state={state} ballot="finalIdentity" dispatch={dispatch} />
      case 'reveal': return <Reveal state={state} dispatch={dispatch} />
      case 'settlement': return <Settlement state={state} dispatch={dispatch} />
    }
  }, [state])

  return <>
    <GameHeader phase={state.phase} seconds={state.secondsLeft} onRules={() => setRulesOpen(true)} onReset={() => dispatch({ type: 'RESET' })} />
    {screen}
    {state.notice && <div className="toast" role="status">{state.notice}</div>}
    {rulesOpen && <RulesModal onClose={() => setRulesOpen(false)} />}
    {import.meta.env.DEV && <DemoControls phase={state.phase} seconds={state.secondsLeft} paused={state.paused} speed={state.speed} onPause={() => dispatch({ type: 'TOGGLE_PAUSE' })} onSpeed={() => dispatch({ type: 'TOGGLE_SPEED' })} onEnd={() => dispatch({ type: 'PHASE_EXPIRED', from: state.phase })} onReset={() => dispatch({ type: 'RESET' })} />}
  </>
}
