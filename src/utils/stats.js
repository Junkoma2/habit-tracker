import { formatDate, parseLocalDate } from './date'

const MS_PER_DAY = 86400000

export function calcCurrentStreak(habitId, records) {
  let count = 0
  const d = new Date()
  d.setHours(0, 0, 0, 0)
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
