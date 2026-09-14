import { countVisibleCharacters } from './graphemes'
import type { InitialPost } from './posts'
import type { GeneratedGameContent, RoundNumber } from './types'

function isGeneratedContent(value: unknown): value is GeneratedGameContent {
  if (!value || typeof value !== 'object') return false
  const data = value as { scenario?: unknown; submissions?: Record<string, unknown> }
  if (typeof data.scenario !== 'string' || data.scenario.trim().length < 4 || countVisibleCharacters(data.scenario) > 50) return false
  if (!data.submissions || typeof data.submissions !== 'object') return false
  return ([1, 2, 3] as RoundNumber[]).every(round => {
    const content = data.submissions?.[round]
    return typeof content === 'string' && content.trim().length > 0 && countVisibleCharacters(content) <= 50
  })
}

export async function generateGameContent(post: InitialPost, signal?: AbortSignal): Promise<GeneratedGameContent> {
  const model = import.meta.env.VITE_AI_MODEL
  if (!model) throw new Error('请先在 .env 中配置 VITE_AI_MODEL。')
  const system = `你是中文创意社交游戏《谁是人机》的内容导演。根据初始帖子，为隐藏 AI 席位生成三轮内容和第三轮追加情景。
只输出 JSON，键必须是 scenario、round1、round2、round3，不要 Markdown。每项不超过 50 个可见字符。
scenario 必须是 15—35 字的陈述句，不能是问句。它要与题干紧密相关，只增加一个具体变量（如时刻、地点或人物处境），同时保留多种提问方向；不能宽泛成“问一个关于咖啡的问题”，也不能堆叠条件限定唯一问法。例如咖啡题可写“这杯咖啡是在凌晨加班结束后喝到的。”
round1 故意有一点标准 AI 答案味；round2 自然、真诚、有具体观察；round3 结合 scenario 提出新颖、值得题主回答的问题。
不要捏造事实，不要提及游戏规则或自己是 AI。`
  const response = await fetch('/api/ai/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      temperature: 0.9,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify({ title: post.title, text: post.text, category: post.category }) },
      ],
    }),
    signal,
  })
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) throw new Error(`模型请求失败（HTTP ${response.status}），请检查 API 配置。`)
  const content = payload && typeof payload === 'object'
    ? (payload as { choices?: Array<{ message?: { content?: unknown } }> }).choices?.[0]?.message?.content
    : undefined
  if (typeof content !== 'string') throw new Error('模型未返回文本内容。')
  let parsed: unknown
  try {
    parsed = JSON.parse(content.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, ''))
  } catch {
    throw new Error('模型未返回有效 JSON，请重试。')
  }
  const raw = parsed as { scenario?: unknown; round1?: unknown; round2?: unknown; round3?: unknown }
  const result = { scenario: raw.scenario, submissions: { 1: raw.round1, 2: raw.round2, 3: raw.round3 } }
  if (!isGeneratedContent(result)) throw new Error('模型返回的内容格式不符合游戏要求，请重试。')
  return result
}
