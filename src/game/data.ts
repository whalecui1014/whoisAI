import type { ContentId, GamePhase, OutfitId, RoundNumber, SeatId } from './types'

export const SEATS: SeatId[] = ['A', 'B', 'C', 'D']
export const ROUNDS: RoundNumber[] = [1, 2, 3]
export const CONTENT_IDS: ContentId[] = ['1', '2', '3', '4']

export const CONTENT_LABELS: Record<ContentId, string> = {
  1: '①',
  2: '②',
  3: '③',
  4: '④',
}

export const OUTFITS: Record<OutfitId, { label: string; src: string; color: string }> = {
  blue: { label: '蓝色连帽衫', src: '/assets/characters/liukanshan-blue.png', color: '#1772f6' },
  green: { label: '绿色背带裤', src: '/assets/characters/liukanshan-green.png', color: '#2f855a' },
  yellow: { label: '黄色针织衫', src: '/assets/characters/liukanshan-yellow.png', color: '#d69e2e' },
  purple: { label: '紫色运动外套', src: '/assets/characters/liukanshan-purple.png', color: '#7251b5' },
}

export const LANDING_COPY = {
  eyebrow: '3 位真人，1 个 AI',
  titleTop: '快来知乎',
  titleBottom: '找人机！',
  subtitle: '这次，真人也来装 AI。',
  description: '三轮猜 AI。猜对 +2 分，被误认票数最高的真人 +3 分。',
  primaryAction: '开始游戏',
  secondaryAction: '看看怎么玩',
  topicLabel: '本局三轮',
}

export interface RoundTopic {
  round: RoundNumber
  kicker: string
  title: string
  task: string
  context: string
  sourceType: string
  maxChars: 30 | 50
  contentKind: '评论' | '问题'
  hints: string[]
  placeholder: string
  voteTitle: string
}

export const ROUND_TOPICS: Record<RoundNumber, RoundTopic> = {
  1: {
    round: 1,
    kicker: '第一轮 · 有梗的帖子',
    title: '为什么《牛来》能申请到龙标？',
    task: '写一条评论。你可以装得像 AI，也可以直接玩梗。',
    context: '只根据题目本身作答，不预设影片内容或具体审核原因。',
    sourceType: '游戏题目',
    maxChars: 50,
    contentKind: '评论',
    hints: ['一本正经分析', '顺着标题玩梗', '抓一个细节说'],
    placeholder: '写下你的评论……',
    voteTitle: '哪条评论是 AI 写的？',
  },
  2: {
    round: 2,
    kicker: '第二轮 · 知识概念题',
    title: 'iPhone duo 的 duo 有什么含义？',
    task: '写一条评论。可以解释你的理解，也可以质疑这个说法。',
    context: '把 duo 当作一个词来谈；不知道词源，也可以只写你确定的理解。',
    sourceType: '游戏题目',
    maxChars: 50,
    contentKind: '评论',
    hints: ['先说你知道的', '不确定可以直说', '别硬堆术语'],
    placeholder: '写下你对 duo 的理解……',
    voteTitle: '这次，哪条评论是 AI 写的？',
  },
  3: {
    round: 3,
    kicker: '第三轮 · 主题提问',
    title: '#西游记',
    task: '围绕 #西游记，提一个问题。',
    context: '人物、情节、设定都可以，一次问清楚一件事。',
    sourceType: '主题标签',
    maxChars: 30,
    contentKind: '问题',
    hints: ['挑一个角色', '抓一段情节', '只问一件事'],
    placeholder: '写一个你真想问的问题……',
    voteTitle: '哪个问题是 AI 提的？',
  },
}

// 仅驱动本机单人模式中的两个模拟真人；当前用户的内容始终由用户自己提交。
export const SCRIPTED_SUBMISSIONS: Record<RoundNumber, Record<SeatId, string>> = {
  1: {
    A: '《牛来》能拿龙标，本质是题材的胜利：纯亲情、低幼向、不碰敏感议题，避开了所有雷区，过审是必然。',
    B: '审核员：九点上班，十一点盖完章，剩下的时间都在怀疑人生。',
    C: '综上，过审取决于内容和标准是否匹配。《牛来》叙事简单、立意明确、合规性无可挑剔，属正常通过。',
    D: '龙标是入场券，不是质量奖；能申请到和好不好看是两回事。',
  },
  2: {
    A: 'duo 就是“两个”的意思吧，放进产品名，听起来比“二代”更像一组搭配。',
    B: '一边喊去英语化，一边跟风用 duo，怎么不直接叫“二”呢？猜猜国内厂商多久跟风。',
    C: 'duo 源自拉丁语，意为“二”，和英语 two、法语 deux 同源，都可追溯至原始印欧语。',
    D: '我只见过 duo 表示二人组合，放在这里还是得看具体命名语境。',
  },
  3: {
    A: '孙悟空被压五百年，怎么没憋疯？',
    B: '妖怪抓到唐僧为什么不直接吃，非要等孙悟空来救？',
    C: '猪八戒在高老庄，是真爱高翠兰还是图她家产？',
    D: '如果没有紧箍咒，孙悟空还会一路护送唐僧吗？',
  },
}

export const PRESET_AI_SUBMISSIONS: Record<RoundNumber, string> = {
  1: '仅从题面看，《牛来》内容低幼、叙事简单，可能较少触及审核争议，但实际通过原因仍要看申报材料。',
  2: 'duo来自拉丁语“二”，原始印欧语拟作*d(u)wóh₁，two、zwei、δύο皆与之同源。',
  3: '西游记四人组，算不算最早的“职场团建”？在线等，挺急的',
}

export const PHASE_SECONDS: Record<GamePhase, number> = {
  landing: 0,
  lobby: 0,
  round1Read: 0,
  round1Write: 120,
  round1Vote: 40,
  round2Read: 0,
  round2Write: 120,
  round2Vote: 40,
  round3Read: 0,
  round3Write: 120,
  round3Vote: 40,
  settlement: 0,
}

export const PHASE_LABELS: Record<GamePhase, string> = {
  landing: '活动首页',
  lobby: '准备开局',
  round1Read: '第一轮 · 看题目',
  round1Write: '第一轮 · 写评论',
  round1Vote: '第一轮 · 猜 AI',
  round2Read: '第二轮 · 看题目',
  round2Write: '第二轮 · 写评论',
  round2Vote: '第二轮 · 猜 AI',
  round3Read: '第三轮 · 看主题',
  round3Write: '第三轮 · 提问题',
  round3Vote: '第三轮 · 猜 AI',
  settlement: '总成绩',
}

export const PHASE_ORDER: GamePhase[] = [
  'lobby',
  'round1Read',
  'round1Write',
  'round1Vote',
  'round2Read',
  'round2Write',
  'round2Vote',
  'round3Read',
  'round3Write',
  'round3Vote',
  'settlement',
]
