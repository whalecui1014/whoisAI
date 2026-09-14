export interface InitialPost {
  id: string
  title: string
  text: string
  textKind: 'full_text' | 'excerpt'
  sourceUrl: string
  author: string | null
  commentCount: number | null
  voteCount: number | null
  readingSeconds: number
  category: 'opinion' | 'knowledge' | 'story'
}

const countOrNull = (value: unknown) => value === null || (Number.isSafeInteger(value) && (value as number) >= 0)

export function isInitialPost(value: unknown): value is InitialPost {
  if (!value || typeof value !== 'object') return false
  const post = value as Record<string, unknown>
  if (typeof post.id !== 'string' || !post.id || typeof post.title !== 'string' || !post.title.trim() || post.title.length > 240 || typeof post.text !== 'string' || !post.text.trim() || post.text.length > 1200) return false
  if (!['full_text', 'excerpt'].includes(post.textKind as string) || !['opinion', 'knowledge', 'story'].includes(post.category as string)) return false
  if (post.author !== null && typeof post.author !== 'string') return false
  if (!countOrNull(post.commentCount) || !countOrNull(post.voteCount) || typeof post.readingSeconds !== 'number' || !Number.isInteger(post.readingSeconds) || post.readingSeconds < 1 || post.readingSeconds > 60) return false
  const seconds = Math.ceil(Array.from(`${post.title}${post.text}`.replace(/\s/g, '')).length / 5)
  if (seconds > 60 || post.readingSeconds < seconds) return false
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
  const valid = data.posts.filter(isInitialPost).filter(post => {
    if (ids.has(post.id)) return false
    ids.add(post.id)
    return true
  }).slice(0, 100).map(post => structuredClone(post))
  catalog = valid.length >= 2 ? valid : []
}

export async function loadPostCatalog(fetcher: typeof fetch = fetch) {
  try {
    const response = await fetcher(`${import.meta.env.BASE_URL}data/initial-posts.json`, { cache: 'no-store', signal: AbortSignal.timeout(4000) })
    if (!response.ok) throw new Error('catalog unavailable')
    setPostCatalog(await response.json())
  } catch { catalog = [] }
  return catalog.length
}

export function pickPost(excludedIds: readonly string[] = []): InitialPost {
  if (catalog.length < 2) throw new Error('至少需要两篇有效的知乎回答才能开始游戏')
  const excluded = new Set(excludedIds)
  const unseen = catalog.filter(post => !excluded.has(post.id))
  // After one complete cycle, start a new cycle but still avoid the last post.
  const previousId = excludedIds.at(-1)
  const pool = unseen.length ? unseen : catalog.filter(post => post.id !== previousId)
  return structuredClone(pool[Math.floor(Math.random() * pool.length)])
}

export function postSourceLabel(post: InitialPost) {
  return post.textKind === 'excerpt' ? '知乎回答摘录' : '知乎回答全文'
}
