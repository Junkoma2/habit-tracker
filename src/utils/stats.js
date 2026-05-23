import { formatDate, parseLocalDate } from './date'

const MS_PER_DAY = 86400000

// 共通マイルストン定義（#273: 全画面で同じ定義を使う）
export const MILESTONES = [
  { days: 1,   label: '1日目',  desc: '最初の記録。続けるきっかけができた。' },
  { days: 4,   label: '4日目',  desc: '最初の壁を越えた。意識から行動へ。' },
  { days: 7,   label: '1週間',  desc: '週のリズムができてきた頃。' },
  { days: 21,  label: '21日目', desc: '行動が少しずつ自動化されてくる段階。' },
  { days: 30,  label: '1か月',  desc: 'ルーティンの形が見えてくる。' },
  { days: 66,  label: '66日目', desc: '習慣が定着するとされる目安の日。' },
  { days: 180, label: '6か月',  desc: 'もはや生活の一部になっている。' },
  { days: 365, label: '1年',    desc: '自分の一部として根づいた証。' },
]

// 次のマイルストンを返す（null = 全達成）
export function getNextMilestone(streak) {
  return MILESTONES.find(m => streak < m.days) ?? null
}

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

// #294: 未達成日の扱いモードに応じた積み上がりを計算
// mode: 'reset' (連続), 'decrement' (1日減算), 'accumulate' (減らさない)
export function calcCurrentStreakWithMode(habitId, records, mode = 'decrement') {
  if (mode === 'reset') {
    return calcCurrentStreak(habitId, records)
  }

  if (mode === 'accumulate') {
    // 達成した日の総数（全期間）
    return Object.values(records).filter(ids => (ids || []).includes(habitId)).length
  }

  // decrement: 達成日は+1、未達成日は-1、ただし0未満にはしない
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // 最古の記録日から今日まで走査するため、まず記録のある最古日を取得
  const sortedDates = Object.keys(records).filter(date => (records[date] || []).includes(habitId)).sort()
  if (sortedDates.length === 0) return 0
  const earliest = new Date(sortedDates[0])
  earliest.setHours(0, 0, 0, 0)
  // earliest から today まで走査
  const cur = new Date(earliest)
  let score = 0
  while (cur <= today) {
    const dateStr = formatDate(cur)
    if ((records[dateStr] || []).includes(habitId)) {
      score++
    } else if (dateStr < formatDate(today)) {
      // 今日はまだ達成できるので減算しない
      score = Math.max(0, score - 1)
    }
    cur.setDate(cur.getDate() + 1)
  }
  return score
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

export function calcPeriodStats(habitId, records, today, createdAt, archivedAt) {
  const todayDate = parseLocalDate(today)
  // 終了済み習慣は archivedAt を集計の上限にする
  const endDate = archivedAt ? new Date(Math.min(todayDate, parseLocalDate(archivedAt))) : todayDate

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
  const monthStart = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
  const effectiveMonthStart = habitStart && habitStart > monthStart ? habitStart : monthStart
  const { achieved: monthCount } = countRange(effectiveMonthStart, endDate)

  // 直近30日
  const thirtyAgo = new Date(endDate)
  thirtyAgo.setDate(thirtyAgo.getDate() - 29)
  const effective30Start = habitStart && habitStart > thirtyAgo ? habitStart : thirtyAgo
  const { achieved: r30, total: t30 } = countRange(effective30Start, endDate)
  const rate30 = t30 > 0 ? Math.round((r30 / t30) * 100) : null

  return { monthCount, rate30 }
}
