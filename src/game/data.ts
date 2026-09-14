import type { BallotType, GamePhase, OutfitId, RoundNumber, SeatId } from './types'

export const SEATS: SeatId[] = ['A', 'B', 'C', 'D']

export const OUTFITS: Record<OutfitId, { label: string; src: string; color: string }> = {
  blue: { label: '蓝色连帽衫', src: '/assets/characters/liukanshan-blue.png', color: '#1772f6' },
  green: { label: '绿色背带裤', src: '/assets/characters/liukanshan-green.png', color: '#2f855a' },
  yellow: { label: '黄色针织衫', src: '/assets/characters/liukanshan-yellow.png', color: '#d69e2e' },
  purple: { label: '紫色运动外套', src: '/assets/characters/liukanshan-purple.png', color: '#7251b5' },
}

export const LANDING_COPY = {
  eyebrow: '三轮匿名评论游戏',
  titleTop: '快来知乎',
  titleBottom: '找人机！',
  subtitle: '这次，真人也来装 AI。',
  description: '三轮、每条最多 50 字：先装 AI，再认真说，最后猜出谁是 AI。',
  primaryAction: '开始一局',
  secondaryAction: '看看怎么玩',
  topicLabel: '本局话题',
}

export const POST = {
  title: '如何看待中国博士人数已经超过驴的存栏量？',
  tag: '博士与驴',
  sourceType: '知乎原帖',
  sourceDescription: '根据知乎原回答压缩整理；原帖将在身份揭晓后开放',
  sourceUrl: 'https://www.zhihu.com/question/2073986909198730674/answer/2076025734280254858',
  excerpt: '有人发现，中国博士人数和驴的存栏量都在 120 万左右。原回答指出，博士总量上升不等于“太多”，中国博士占总人口的比例仍低于欧美；更明显的变化是，驴存栏从上世纪 90 年代的千万头级别降到了百万头级别。这个看似离谱的比较，究竟说明了什么？',
  newCondition: '原回答补充：中国博士总数约 120 万，但占总人口比例低于欧美；驴存栏已从上世纪 90 年代的千万头级别降到约 120 万。',
  copyPrefix: '补充资料：回答提到中国博士总数约 120 万，而驴存栏从千万头级别降到约 120 万。我想问：',
}

export const ROUND_COPY: Record<RoundNumber, { kicker: string; title: string; task: string; hints: string[]; placeholder: string; lockedNext: string; publicTitle: string; publicDescription: string; publicNext: string }> = {
  1: {
    kicker: '第一轮 · 全员装人机',
    title: '先把自己写得像 AI',
    task: '围绕这篇帖子，写一条刻意像 AI 的评论。',
    hints: ['综合评估……', '建议结合……', '从多个维度来看……'],
    placeholder: '写一句有点“标准答案味”的话……',
    lockedNext: '查看四条评论',
    publicTitle: '四条“AI 味”评论已公开',
    publicDescription: '先看完四条，再猜哪一席真的由 AI 控制。',
    publicNext: '猜谁是 AI',
  },
  2: {
    kicker: '第二轮 · 这次认真说',
    title: '你会怎么回复题主？',
    task: '如果这条评论真的留在帖子下面，你会说什么？',
    hints: ['我在意的是……', '容易被忽略的是……', '如果是我，我会……'],
    placeholder: '把你真正想说的话写下来……',
    lockedNext: '查看四条评论',
    publicTitle: '四条评论已公开',
    publicDescription: '这轮只看内容：哪一条最值得点赞？',
    publicNext: '选一条想点赞的评论',
  },
  3: {
    kicker: '第三轮 · 这问题值得问',
    title: '还有什么没问清楚？',
    task: '根据新条件，只问一个可能改变你判断的问题。',
    hints: ['这个条件稳定吗？', '还有什么成本没算？', '如果情况变化呢？'],
    placeholder: '写一个值得题主回应的问题……',
    lockedNext: '查看四个问题',
    publicTitle: '四个问题已公开',
    publicDescription: '先选一个最想让题主回答的问题，下一页再猜谁是 AI。',
    publicNext: '选一个想回答的问题',
  },
}

// 仅用于本地单人流程；真实多人对局不得复用这些席位内容。
export const SCRIPTED_SUBMISSIONS: Record<RoundNumber, Record<SeatId, string>> = {
  1: {
    A: '我就在这里，不躲，不藏，不绕，不逃，稳稳地接住你',
    B: '我用最直白，最不绕弯子，最一阵见血的方式告诉你，你毕不了业了',
    C: '你的观察力太敏锐了!这是典型的顶级研究者才具备的批判性思维！',
    D: '这不是你的能力不足，而是知识内卷与草料供给的结构性错配。',
  },
  2: {
    A: '这组数字确实好笑，但总量和占比是两回事，不能据此判断博士是不是太多。',
    B: '比起博士变多，我更意外驴少了这么多。这个变化本身更值得追问。',
    C: '把两个没关系的数字放在一起很抓眼球，但它更像一个话题入口，不是结论。',
    D: '我会先确认两个“120 万”是不是同一年、同一口径，再讨论这个比较说明什么。',
  },
  3: {
    A: '博士人数和驴存栏的数据分别来自哪一年？',
    B: '如果比较人口占比而不是总数，结论会发生什么变化？',
    C: '驴存栏减少主要是需求下降，还是养殖周期太长？',
    D: '提出这个比较，真正想讨论的是博士变多还是驴变少？',
  },
}

export const VOTE_COPY: Record<BallotType, { title: string; subtitle: string; round: RoundNumber; button: string; next: string }> = {
  round1Identity: { title: '第一轮，你觉得谁是 AI？', subtitle: '选一个其他席位。确认前可以改，确认后锁定。', round: 1, button: '确认指认', next: '进入第二轮' },
  round2Quality: { title: '哪条评论最值得你点赞？', subtitle: '这一票只看内容，不猜身份。', round: 2, button: '确认点赞', next: '进入第三轮' },
  round3Quality: { title: '你最想让题主回答哪个问题？', subtitle: '先选问题；下一页再猜 AI。', round: 3, button: '确认选择', next: '最后一次，猜谁是 AI' },
  finalIdentity: { title: '最后一次，你觉得谁是 AI？', subtitle: '确认后将揭晓身份。', round: 3, button: '确认最终选择', next: '揭晓谁是 AI' },
}

export const SAMPLE_SCRIPTED_BALLOTS: Record<BallotType, Record<SeatId, SeatId>> = {
  round1Identity: { A: 'D', B: 'A', C: 'A', D: 'B' },
  round2Quality: { A: 'B', B: 'C', C: 'B', D: 'A' },
  round3Quality: { A: 'C', B: 'A', C: 'A', D: 'B' },
  finalIdentity: { A: 'D', B: 'D', C: 'B', D: 'A' },
}

export const PHASE_SECONDS: Record<GamePhase, number> = {
  landing: 0,
  lobby: 0,
  reading: 30,
  round1Write: 40,
  round1Public: 20,
  round1Vote: 20,
  round2Write: 45,
  round2Public: 20,
  round2Vote: 20,
  round3Write: 45,
  round3Public: 20,
  round3QualityVote: 20,
  finalIdentityVote: 20,
  reveal: 10,
  settlement: 35,
}

export const PHASE_LABELS: Record<GamePhase, string> = {
  landing: '活动首页', lobby: '对局准备', reading: '阅读帖子', round1Write: '第一轮写作', round1Public: '第一轮公开', round1Vote: '第一轮猜 AI', round2Write: '第二轮写作', round2Public: '第二轮公开', round2Vote: '第二轮选评论', round3Write: '第三轮提问', round3Public: '第三轮公开', round3QualityVote: '第三轮选问题', finalIdentityVote: '最终猜 AI', reveal: '身份揭晓', settlement: '本局结算',
}

export const PHASE_ORDER: GamePhase[] = ['lobby', 'reading', 'round1Write', 'round1Public', 'round1Vote', 'round2Write', 'round2Public', 'round2Vote', 'round3Write', 'round3Public', 'round3QualityVote', 'finalIdentityVote', 'reveal', 'settlement']
