export function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getToday() {
  return formatDate(new Date())
}

export function getYesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return formatDate(d)
}

export function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDisplayDate(dateStr) {
  const date = parseLocalDate(dateStr)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dow = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
  return `${year}年${month}月${day}日（${dow}）`
}

export const HABIT_COLORS = [
  '#FF6B6B',
  '#FF9F43',
  '#FECA57',
  '#48DBB4',
  '#54A0FF',
  '#A29BFE',
  '#FD79A8',
  '#6C5CE7',
]
