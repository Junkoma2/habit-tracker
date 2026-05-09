import { formatDate, parseLocalDate, HABIT_COLORS } from '../utils/date'
import { calcCurrentStreak } from '../utils/stats'
import { getPhase } from '../utils/habitPhase'
import StatsAdviceCard from './StatsAdviceCard'
import StatsWeekdayCard from './StatsWeekdayCard'
import StatsCategoryCard from './StatsCategoryCard'
import StatsPhaseCard from './StatsPhaseCard'
import './StatsView.css'

const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土']

function isHabitActiveOn(habit, dateStr) {
  if (habit.createdAt && dateStr < habit.createdAt) return false
  if (habit.archivedAt && dateStr >= habit.archivedAt) return false
  return true
}

function calcRateForRange(habits, records, today, days) {
  const end = parseLocalDate(today)
  let achieved = 0
  let total = 0

  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(end)
    date.setDate(date.getDate() - offset)
    const dateStr = formatDate(date)
    const activeHabits = habits.filter(habit => isHabitActiveOn(habit, dateStr))
    const dayRecords = records[dateStr] || []

    total += activeHabits.length
    achieved += activeHabits.filter(habit => dayRecords.includes(habit.id)).length
  }

  return total > 0 ? Math.round((achieved / total) * 100) : null
}

function calcWeekdayRates(habits, records, today, days = 30) {
  const end = parseLocalDate(today)
  const buckets = DOW_LABELS.map(label => ({ label, achieved: 0, total: 0 }))

  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(end)
    date.setDate(date.getDate() - offset)
    const dateStr = formatDate(date)
    const bucket = buckets[date.getDay()]
    const activeHabits = habits.filter(habit => isHabitActiveOn(habit, dateStr))
    const dayRecords = records[dateStr] || []

    bucket.total += activeHabits.length
    bucket.achieved += activeHabits.filter(habit => dayRecords.includes(habit.id)).length
  }

  return buckets.map(bucket => ({
    label: bucket.label,
    rate: bucket.total > 0 ? Math.round((bucket.achieved / bucket.total) * 100) : null,
  }))
}

function calcColorStats(habits, records, today, colorCategories) {
  const activeHabits = habits.filter(h => !h.archivedAt)
  return HABIT_COLORS
    .filter(color => colorCategories[color]?.trim())
    .map(color => {
      const colorHabits = activeHabits.filter(h => h.color === color)
      return {
        color,
        name: colorCategories[color],
        count: colorHabits.length,
        rate: calcRateForRange(colorHabits, records, today, 30),
      }
    })
    .filter(c => c.count > 0)
    .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1))
}

export default function StatsView({ habits, records, today, colorCategories = {} }) {
  const activeHabits = habits.filter(habit => !habit.archivedAt)
  const rate7 = calcRateForRange(habits, records, today, 7)
  const rate30 = calcRateForRange(habits, records, today, 30)
  const weekdayRates = calcWeekdayRates(habits, records, today)
  const colorStats = calcColorStats(habits, records, today, colorCategories)
  const hasNamedColors = Object.values(colorCategories).some(v => v?.trim())

  const habitPhases = activeHabits
    .map(h => ({ habit: h, streak: calcCurrentStreak(h.id, records), ...getPhase(calcCurrentStreak(h.id, records)) }))
    .sort((a, b) => b.streak - a.streak)

  if (habits.length === 0) {
    return <p className="analysis-empty">習慣を追加すると、達成率が表示されます。</p>
  }

  return (
    <>
      <StatsAdviceCard rate7={rate7} rate30={rate30} />

      {hasNamedColors && (
        <StatsCategoryCard colorStats={colorStats} />
      )}

      <StatsWeekdayCard weekdayRates={weekdayRates} />

      {habitPhases.length > 0 && (
        <StatsPhaseCard habitPhases={habitPhases} />
      )}

      <p className="analysis-note section">
        今の対象習慣は {activeHabits.length} 件です。達成率は、その日に対象だった習慣だけで計算しています。
      </p>
    </>
  )
}
