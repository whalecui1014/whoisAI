const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl
  ? new Intl.Segmenter('zh-CN', { granularity: 'grapheme' })
  : null

export function countVisibleCharacters(value: string): number {
  if (segmenter) return Array.from(segmenter.segment(value)).length
  return Array.from(value).length
}

export function validateSubmission(value: string): string | null {
  if (!value.trim()) return '内容不能为空，请写下你的想法。'
  if (countVisibleCharacters(value) > 50) return '超过 50 个字，请修改后再提交。'
  return null
}
