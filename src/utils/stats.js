import { formatDate } from './date'

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

export function calcStats(habitId, records) {
  const total = Object.keys(records).filter(date => (records[date] || []).includes(habitId)).length
  if (total === 0) return { current: 0, total: 0 }
  return { current: calcCurrentStreak(habitId, records), total }
}
