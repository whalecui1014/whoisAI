import type { BallotType, GamePhase, OutfitId, RoundNumber, SeatId } from './types'

export const SEATS: SeatId[] = ['A', 'B', 'C', 'D']

export const OUTFITS: Record<OutfitId, { label: string; src: string; color: string }> = {
  blue: { label: '蓝色连帽衫', src: '/assets/characters/liukanshan-blue.png', color: '#1772f6' },
  green: { label: '绿色背带裤', src: '/assets/characters/liukanshan-green.png', color: '#2f855a' },
  yellow: { label: '黄色针织衫', src: '/assets/characters/liukanshan-yellow.png', color: '#d69e2e' },
  purple: { label: '紫色运动外套', src: '/assets/characters/liukanshan-purple.png', color: '#7251b5' },
}

export const POST = {
  title: '刚工作，每月省 800 元房租，但单程通勤从 20 分钟变成一小时，值得吗？',
  sourceType: '原创情境内容',
  excerpt: '我刚工作时选了远一点的房子。每月省下八百块，至少月底不用掐着钱吃饭。地铁上听播客、看看小说，也没想象中难熬。住得近当然舒服，但对手头不宽裕的人来说，先把固定开销压下来，心里更踏实。等收入涨了再搬，总比每个月都为房租发愁好。',
  newCondition: '题主每周可居家办公三天，只需要去公司两天。',
}

export const ROUND_COPY: Record<RoundNumber, { kicker: string; title: string; task: string; hints: string[] }> = {
  1: {
    kicker: '第一轮 · 全员装人机',
    title: '故意写得像 AI 一点',
    task: '围绕这篇帖子，故意写得像 AI 一点。看看谁能把人类演没了。',
    hints: ['综合评估……', '建议结合……', '从多个维度来看……'],
  },
  2: {
    kicker: '第二轮 · 这次认真说',
    title: '把真正想说的话写出来',
    task: '如果这条评论真的留在帖子下面，你会说什么？',
    hints: ['我在意的是……', '容易被忽略的是……', '如果是我，我会……'],
  },
  3: {
    kicker: '第三轮 · 这问题值得问',
    title: '写一个值得题主回答的问题',
    task: '有了这个条件，你最想继续问什么？写一个值得题主回答的问题。',
    hints: ['这个条件稳定吗？', '还有什么成本没算？', '如果情况变化呢？'],
  },
}

export const SCRIPTED_SUBMISSIONS: Record<RoundNumber, Record<SeatId, string>> = {
  1: {
    A: '综合评估预算、通勤与个人偏好后，建议选择最适合自身的方案。',
    B: '基于成本收益分析，通勤时长与房租水平需要综合权衡。',
    C: '建议结合个人预算、时间价值及未来规划做出理性决策。',
    D: '可建立房租与通勤成本模型，再根据权重选择最优方案。',
  },
  2: {
    A: '每天多八十分钟，我宁愿省别的钱。下班后的时间也很贵。',
    B: '每月省八百，但每天多耗掉八十分钟，我会优先保住下班后的时间。',
    C: '预算紧可以先住远些，但换乘和加班后的回家成本也要算上。',
    D: '省下的是房租，失去的是长期精力；短期过渡可以，别默认一直忍。',
  },
  3: {
    A: '居家办公写进制度了吗？如果以后变成天天到岗，你还能承受吗？',
    B: '公司以后会不会取消居家？如果恢复到岗，这套方案还能撑多久？',
    C: '居家办公日固定吗？临时到岗增加时，你能接受额外成本吗？',
    D: '每周只去两天，省下的房租能覆盖偶尔打车和时间损耗吗？',
  },
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
  landing: '活动首页', lobby: '对局准备', reading: '阅读帖子', round1Write: '第一轮写作', round1Public: '第一轮统一公开', round1Vote: '第一轮猜身份', round2Write: '第二轮写作', round2Public: '第二轮统一公开', round2Vote: '第二轮评评论', round3Write: '第三轮提问题', round3Public: '第三轮统一公开', round3QualityVote: '第三轮评问题', finalIdentityVote: '最终身份指认', reveal: '揭晓 AI', settlement: '本局结算',
}

export const PHASE_ORDER: GamePhase[] = ['lobby', 'reading', 'round1Write', 'round1Public', 'round1Vote', 'round2Write', 'round2Public', 'round2Vote', 'round3Write', 'round3Public', 'round3QualityVote', 'finalIdentityVote', 'reveal', 'settlement']
