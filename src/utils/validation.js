const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isValidDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

export function validateImportData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return 'データの形式が正しくありません。'
  }
  if (!Array.isArray(data.habits)) {
    return '「habits」が配列ではありません。'
  }
  const habitIds = new Set()
  for (const [i, h] of data.habits.entries()) {
    if (!h || typeof h !== 'object') return `habits[${i}] がオブジェクトではありません。`
    if (typeof h.id !== 'string' || !h.id) return `habits[${i}] に有効な id がありません。`
    if (habitIds.has(h.id)) return `habits に重複した id「${h.id}」があります。`
    habitIds.add(h.id)
    if (typeof h.name !== 'string' || !h.name.trim()) return `habits[${i}] に有効な name がありません。`
    if (typeof h.color !== 'string' || !h.color) return `habits[${i}] に有効な color がありません。`
    if (h.createdAt !== undefined && (typeof h.createdAt !== 'string' || !DATE_RE.test(h.createdAt) || !isValidDate(h.createdAt))) {
      return `habits[${i}] の createdAt「${h.createdAt}」が有効な日付ではありません。`
    }
    if (h.archivedAt != null && (typeof h.archivedAt !== 'string' || !DATE_RE.test(h.archivedAt) || !isValidDate(h.archivedAt))) {
      return `habits[${i}] の archivedAt「${h.archivedAt}」が有効な日付ではありません。`
    }
    if (h.createdAt && h.archivedAt && h.archivedAt < h.createdAt) {
      return `habits[${i}] の archivedAt が createdAt より前の日付です。`
    }
  }
  if (!data.records || typeof data.records !== 'object' || Array.isArray(data.records)) {
    return '「records」がオブジェクトではありません。'
  }
  for (const [date, ids] of Object.entries(data.records)) {
    if (!DATE_RE.test(date)) return `records のキー「${date}」が日付形式（YYYY-MM-DD）ではありません。`
    if (!isValidDate(date)) return `records のキー「${date}」は存在しない日付です。`
    if (!Array.isArray(ids)) return `records[${date}] が配列ではありません。`
    if (ids.some(id => typeof id !== 'string')) return `records[${date}] に文字列以外の値が含まれています。`
  }
  return null
}

export function sanitizeImportData(data) {
  const habitIds = new Set(data.habits.map(h => h.id))
  const records = {}
  let skippedUnknownRecords = 0

  for (const [date, ids] of Object.entries(data.records)) {
    const knownIds = ids.filter(id => {
      const known = habitIds.has(id)
      if (!known) skippedUnknownRecords += 1
      return known
    })
    if (knownIds.length > 0) records[date] = knownIds
  }

  return {
    data: {
      habits: data.habits,
      records,
      ...(data.colorCategories && typeof data.colorCategories === 'object' && !Array.isArray(data.colorCategories)
        ? { colorCategories: data.colorCategories }
        : {}),
      ...(data.statsStartDate && typeof data.statsStartDate === 'string' ? { statsStartDate: data.statsStartDate } : {}),
      ...(data.streakMode && typeof data.streakMode === 'string' ? { streakMode: data.streakMode } : {}),
    },
    skippedUnknownRecords,
  }
}
