const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function validateImportData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return 'データの形式が正しくありません。'
  }
  if (!Array.isArray(data.habits)) {
    return '「habits」が配列ではありません。'
  }
  for (const [i, h] of data.habits.entries()) {
    if (!h || typeof h !== 'object') return `habits[${i}] がオブジェクトではありません。`
    if (typeof h.id !== 'string' || !h.id) return `habits[${i}] に有効な id がありません。`
    if (typeof h.name !== 'string' || !h.name.trim()) return `habits[${i}] に有効な name がありません。`
    if (typeof h.color !== 'string' || !h.color) return `habits[${i}] に有効な color がありません。`
  }
  if (!data.records || typeof data.records !== 'object' || Array.isArray(data.records)) {
    return '「records」がオブジェクトではありません。'
  }
  for (const [date, ids] of Object.entries(data.records)) {
    if (!DATE_RE.test(date)) return `records のキー「${date}」が日付形式（YYYY-MM-DD）ではありません。`
    if (!Array.isArray(ids)) return `records[${date}] が配列ではありません。`
    if (ids.some(id => typeof id !== 'string')) return `records[${date}] に文字列以外の値が含まれています。`
  }
  return null
}
