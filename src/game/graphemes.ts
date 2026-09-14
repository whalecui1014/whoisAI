const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl
  ? new Intl.Segmenter('zh-CN', { granularity: 'grapheme' })
  : null

export function countVisibleCharacters(value: string): number {
  if (segmenter) return Array.from(segmenter.segment(value)).length
  return Array.from(value).length
}

export function validateSubmission(value: string, maxChars = 50): string | null {
  if (!value.trim()) return '先写点什么再提交吧。'
  if (countVisibleCharacters(value) > maxChars) return `超过 ${maxChars} 字了，删短一点再提交。`
  return null
}
