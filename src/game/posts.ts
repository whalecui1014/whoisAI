import { POST } from './data'

export interface InitialPost {
  id: string
  title: string
  text: string
  textKind: 'full_text' | 'excerpt' | 'original'
  sourceUrl: string | null
  author: string | null
  commentCount: number | null
  voteCount: number | null
  readingSeconds: number
  category: 'opinion' | 'knowledge' | 'story'
}

export const FALLBACK_POST: InitialPost = {
  id: 'demo-commute', title: POST.title, text: POST.excerpt, textKind: 'original',
  sourceUrl: null, author: null, commentCount: null, voteCount: null,
  readingSeconds: Math.max(30, Math.ceil(Array.from(`${POST.title}${POST.excerpt}`.replace(/\s/g, '')).length / 5)), category: 'opinion',
}

const countOrNull = (value: unknown) => value === null || (Number.isSafeInteger(value) && (value as number) >= 0)

export function isInitialPost(value: unknown): value is InitialPost {
  if (!value || typeof value !== 'object') return false
  const post = value as Record<string, unknown>
  if (typeof post.id !== 'string' || !post.id || typeof post.title !== 'string' || !post.title.trim() || post.title.length > 240 || typeof post.text !== 'string' || !post.text.trim() || post.text.length > 1200) return false
  if (!['full_text', 'excerpt', 'original'].includes(post.textKind as string) || !['opinion', 'knowledge', 'story'].includes(post.category as string)) return false
  if (post.author !== null && typeof post.author !== 'string') return false
  if (!countOrNull(post.commentCount) || !countOrNull(post.voteCount) || typeof post.readingSeconds !== 'number' || !Number.isInteger(post.readingSeconds) || post.readingSeconds < 1 || post.readingSeconds > 60) return false
  const seconds = Math.ceil(Array.from(`${post.title}${post.text}`.replace(/\s/g, '')).length / 5)
  if (seconds > 60 || post.readingSeconds < seconds) return false
  if (post.textKind === 'original') return post.id === FALLBACK_POST.id && post.sourceUrl === null
  try {
    if (typeof post.sourceUrl !== 'string') return false
    const url = new URL(post.sourceUrl)
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && ['www.zhihu.com', 'zhihu.com'].includes(url.hostname) && /^\/(?:question\/\d+\/)?answer\/\d+\/?$/.test(url.pathname)
  } catch { return false }
}

let catalog: InitialPost[] = []

export function setPostCatalog(payload: unknown) {
  if (!payload || typeof payload !== 'object') { catalog = []; return }
  const data = payload as { schemaVersion?: unknown; posts?: unknown }
  if (data.schemaVersion !== 1 || !Array.isArray(data.posts)) { catalog = []; return }
  const ids = new Set<string>()
  catalog = data.posts.filter(isInitialPost).filter(post => {
    if (post.textKind === 'original' || ids.has(post.id)) return false
    ids.add(post.id)
    return true
  }).slice(0, 100).map(post => structuredClone(post))
}

export async function loadPostCatalog(fetcher: typeof fetch = fetch) {
  try {
    const response = await fetcher(`${import.meta.env.BASE_URL}data/initial-posts.json`, { cache: 'no-store', signal: AbortSignal.timeout(4000) })
    if (!response.ok) throw new Error('catalog unavailable')
    setPostCatalog(await response.json())
  } catch { catalog = [] }
}

export function pickPost(previousId?: string): InitialPost {
  const pool = catalog.filter(post => post.id !== previousId)
  const available = pool.length ? pool : catalog
  return structuredClone(available.length ? available[Math.floor(Math.random() * available.length)] : FALLBACK_POST)
}

export function postSourceLabel(post: InitialPost) {
  return post.textKind === 'original' ? '原创情境内容' : post.textKind === 'excerpt' ? '知乎回答摘录' : '知乎回答全文'
}
