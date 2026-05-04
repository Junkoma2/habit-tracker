import { formatDate, parseLocalDate } from './date'

const MS_PER_DAY = 86400000

export function calcCurrentStreak(habitId, records) {
  let count = 0
  const d = new Date()
  d.setHours(0, 0, 0, 0)

  // 今日が未達なら昨日から遡る（当日中はまだ達成できるため途切れ扱いにしない）
  const todayStr = formatDate(d)
  if (!(records[todayStr] || []).includes(habitId)) {
    d.setDate(d.getDate() - 1)
  }

  while (true) {
    const dateStr = formatDate(d)
    if ((records[dateStr] || []).includes(habitId)) {
      count++
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }
  return count
}

export function calcStats(habitId, records) {
  const completedDates = Object.keys(records)
    .filter(date => (records[date] || []).includes(habitId))
    .sort()

  const total = completedDates.length
  if (total === 0) return { current: 0, longest: 0, total: 0 }

  let longest = 1, run = 1
  for (let i = 1; i < completedDates.length; i++) {
    const prev = parseLocalDate(completedDates[i - 1])
    const curr = parseLocalDate(completedDates[i])
    const diff = (curr - prev) / MS_PER_DAY
    if (diff === 1) {
      run++
      if (run > longest) longest = run
    } else {
      run = 1
    }
  }

  const current = calcCurrentStreak(habitId, records)
  return { current, longest, total }
}

export function calcPeriodStats(habitId, records, today, createdAt) {
  const todayDate = parseLocalDate(today)

  function countRange(start, end) {
    let achieved = 0, total = 0
    const d = new Date(start)
    while (d <= end) {
      const dateStr = formatDate(d)
      total++
      if ((records[dateStr] || []).includes(habitId)) achieved++
      d.setDate(d.getDate() + 1)
    }
    return { achieved, total }
  }

  const habitStart = createdAt ? parseLocalDate(createdAt) : null

  // 今月
  const monthStart = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)
  const effectiveMonthStart = habitStart && habitStart > monthStart ? habitStart : monthStart
  const { achieved: monthCount } = countRange(effectiveMonthStart, todayDate)

  // 直近30日
  const thirtyAgo = new Date(todayDate)
  thirtyAgo.setDate(thirtyAgo.getDate() - 29)
  const effective30Start = habitStart && habitStart > thirtyAgo ? habitStart : thirtyAgo
  const { achieved: r30, total: t30 } = countRange(effective30Start, todayDate)
  const rate30 = t30 > 0 ? Math.round((r30 / t30) * 100) : null

  return { monthCount, rate30 }
}
