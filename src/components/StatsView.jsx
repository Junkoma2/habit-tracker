import { formatDate, parseLocalDate, HABIT_COLORS } from '../utils/date'
import { calcCurrentStreak } from '../utils/stats'
import StatsAdviceCard from './StatsAdviceCard'
import StatsWeekdayCard from './StatsWeekdayCard'
import StatsCategoryCard from './StatsCategoryCard'
import './StatsView.css'

const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土']

function isHabitActiveOn(habit, dateStr) {
  if (habit.createdAt && dateStr < habit.createdAt) return false
  if (habit.archivedAt && dateStr >= habit.archivedAt) return false
  return true
}

// statsStartDate が設定されている場合、その日より前は集計対象外にする
function calcRateForRange(habits, records, today, days, statsStartDate) {
  const end = parseLocalDate(today)
  const startBound = statsStartDate ? parseLocalDate(statsStartDate) : null
  let achieved = 0
  let total = 0

  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(end)
    date.setDate(date.getDate() - offset)
    // statsStartDate より前の日は集計に含めない
    if (startBound && date < startBound) continue
    const dateStr = formatDate(date)
    const activeHabits = habits.filter(habit => isHabitActiveOn(habit, dateStr))
    const dayRecords = records[dateStr] || []

    total += activeHabits.length
    achieved += activeHabits.filter(habit => dayRecords.includes(habit.id)).length
  }

  return total > 0 ? Math.round((achieved / total) * 100) : null
}

function calcWeekdayRates(habits, records, today, days = 30, statsStartDate) {
  const end = parseLocalDate(today)
  const startBound = statsStartDate ? parseLocalDate(statsStartDate) : null
  const buckets = DOW_LABELS.map(label => ({ label, achieved: 0, total: 0 }))

  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(end)
    date.setDate(date.getDate() - offset)
    if (startBound && date < startBound) continue
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

function calcColorStats(habits, records, today, colorCategories, statsStartDate) {
  const activeHabits = habits.filter(h => !h.archivedAt)
  return HABIT_COLORS
    .filter(color => colorCategories[color]?.trim())
    .map(color => {
      const colorHabits = activeHabits.filter(h => h.color === color)
      return {
        color,
        name: colorCategories[color],
        count: colorHabits.length,
        rate: calcRateForRange(colorHabits, records, today, 30, statsStartDate),
      }
    })
    .filter(c => c.count > 0)
    .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1))
}

export default function StatsView({ habits, records, today, colorCategories = {}, statsStartDate = null }) {
  const rate7 = calcRateForRange(habits, records, today, 7, statsStartDate)
  const rate30 = calcRateForRange(habits, records, today, 30, statsStartDate)
  const weekdayRates = calcWeekdayRates(habits, records, today, 30, statsStartDate)
  const colorStats = calcColorStats(habits, records, today, colorCategories, statsStartDate)
  const hasNamedColors = Object.values(colorCategories).some(v => v?.trim())

  if (habits.length === 0) {
    return <p className="analysis-empty">習慣を追加すると、達成率が表示されます。</p>
  }

  return (
    <>
      <StatsAdviceCard rate7={rate7} rate30={rate30} statsStartDate={statsStartDate} />

      {hasNamedColors && (
        <StatsCategoryCard colorStats={colorStats} />
      )}

      <StatsWeekdayCard weekdayRates={weekdayRates} />
    </>
  )
}
