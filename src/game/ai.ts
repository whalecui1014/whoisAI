import { PRESET_AI_SUBMISSIONS, ROUND_TOPICS, ROUNDS } from './data'
import { countVisibleCharacters } from './graphemes'
import type { GeneratedGameContent, RoundNumber } from './types'

export function presetGameContent(): GeneratedGameContent {
  return { source: 'preset', submissions: { ...PRESET_AI_SUBMISSIONS } }
}

function isGeneratedContent(value: unknown): value is GeneratedGameContent {
  if (!value || typeof value !== 'object') return false
  const data = value as { source?: unknown; submissions?: Record<string, unknown> }
  if (data.source !== 'model' && data.source !== 'preset') return false
  if (!data.submissions || typeof data.submissions !== 'object') return false
  return ROUNDS.every(round => {
    const content = data.submissions?.[round]
    return typeof content === 'string'
      && content.trim().length > 0
      && countVisibleCharacters(content) <= ROUND_TOPICS[round].maxChars
  })
}

export async function generateGameContent(signal?: AbortSignal): Promise<GeneratedGameContent> {
  const model = import.meta.env.VITE_AI_MODEL
  if (!model) return presetGameContent()

  const system = `你是中文游戏《谁是人机》中隐藏的 AI 作者。请为三个互不相关的轮次各写一条内容。
只输出 JSON，键必须是 round1、round2、round3，不要 Markdown。
第一轮题目“为什么《牛来》能申请到龙标？”：写一条不超过50字的评论，语气克制、工整；只回应题目，不把影片内容或审核原因写成已核实事实。
第二轮题目“iPhone duo 的 duo 有什么含义？”：写一条不超过50字的评论，给出有依据且谨慎的词义解释；不要编造产品功能、官方命名意图或词源。
第三轮主题“#西游记”：只提一个不超过30字的问题，尝试玩梗，可以略老、略显用力；不要分析梗，不要自曝身份。
三条内容不要故意写成相同长度或相同句式，也不要提及游戏规则。`

  const response = await fetch('/api/ai/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      temperature: 0.85,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: '请按三个题目分别生成本局内容。' },
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

  const raw = parsed as { round1?: unknown; round2?: unknown; round3?: unknown }
  const result: GeneratedGameContent = {
    source: 'model',
    submissions: { 1: raw.round1 as string, 2: raw.round2 as string, 3: raw.round3 as string },
  }
  if (!isGeneratedContent(result)) throw new Error('模型返回的内容格式不符合 50/50/30 字限制，请重试。')
  return result
}

export function validateGeneratedSubmission(round: RoundNumber, value: string): boolean {
  return Boolean(value.trim()) && countVisibleCharacters(value) <= ROUND_TOPICS[round].maxChars
}
