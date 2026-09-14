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
  title: '和朋友旅行，有人把五天行程排到小时，我想随性一点，该提前说吗？',
  tag: '朋友旅行',
  sourceType: '游戏示例',
  sourceDescription: '为本局创作的游戏示例，不对应真实作者、赞同数或原帖链接',
  excerpt: '下个月我和三位朋友去旅行。有人已经做好五天攻略，景点、餐厅和交通都排到了具体时间。我看到清单就有点累，更想每天只定一两个地方，剩下的时间随走随停。现在提出会不会扫兴，还是到了再看情况？',
  newCondition: '同行者说清单只是备选，不要求全部打卡；但其中两项活动已经付款，取消不退款。',
  copyPrefix: '补充条件：同行者说清单只是备选，但其中两项活动取消不退款。我想问：',
}

export const ROUND_COPY: Record<RoundNumber, { kicker: string; title: string; task: string; hints: string[]; placeholder: string; lockedNext: string; publicTitle: string; publicDescription: string; publicNext: string }> = {
  1: {
    kicker: '第一轮 · 全员装人机',
    title: '先把自己写得像 AI',
    task: '围绕这篇帖子，写一条刻意像 AI 的评论。',
    hints: ['列出三项考虑因素', '给一个过分周全的方案', '像总结报告一样收尾'],
    placeholder: '一本正经地给个建议……',
    lockedNext: '查看四条评论',
    publicTitle: '四条“AI 味”评论已公开',
    publicDescription: '先看完四条，再猜哪一席真的由 AI 控制。',
    publicNext: '猜谁是 AI',
  },
  2: {
    kicker: '第二轮 · 这次认真说',
    title: '你会怎么回复题主？',
    task: '如果这条评论真的留在帖子下面，你会说什么？',
    hints: ['你更在意旅行节奏，还是同行感受？', '攻略已经有人做了，你会怎么回应？', '哪些行程想一起，哪些想留白？'],
    placeholder: '写下你最在意的一点……',
    lockedNext: '查看四条评论',
    publicTitle: '四条评论已公开',
    publicDescription: '这轮只看内容：哪一条最值得点赞？',
    publicNext: '选一条想点赞的评论',
  },
  3: {
    kicker: '第三轮 · 这问题值得问',
    title: '还有什么没问清楚？',
    task: '根据新条件，只问一个可能改变你判断的问题。',
    hints: ['先问清时间限制', '确认能否分开行动', '只追问一个关键条件'],
    placeholder: '只问一个你最想确认的问题……',
    lockedNext: '查看四个问题',
    publicTitle: '四个问题已公开',
    publicDescription: '先选一个最想让题主回答的问题，下一页再猜谁是 AI。',
    publicNext: '选一个想回答的问题',
  },
}

// 仅用于本地单人流程；真实多人对局不得复用这些席位内容。
export const SCRIPTED_SUBMISSIONS: Record<RoundNumber, Record<SeatId, string>> = {
  1: {
    A: '建议从同行关系、体力分配与时间成本三个维度综合评估，以实现旅行体验最优解。',
    B: '五天行程已规划到小时，按计划执行能减少现场决策成本，避免团队效率下降。',
    C: '可以采用“固定项目+自由时段”的混合方案，兼顾攻略成果与旅行弹性。',
    D: '首先认可对方的攻略投入，其次说明节奏偏好，最后确认必须参加的项目。',
  },
  2: {
    A: '我会现在说。到了当地再临时改，做攻略的人反而更难受。',
    B: '五天很短，我愿意先照计划走两天；如果太累，再留半天自己逛。',
    C: '攻略可以参考，别变成全员打卡表。想慢一点也该提前说清楚。',
    D: '先问哪些项目大家一定想一起去，其他时间分开行动也挺好。',
  },
  3: {
    A: '两项已付款的活动分别在什么时候？',
    B: '如果有人不参加已付款的活动，费用怎么分？',
    C: '除了那两项活动，大家能接受分开行动吗？',
    D: '做攻略的朋友最希望大家保留的是哪一段行程？',
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
