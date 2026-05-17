import { formatDate, parseLocalDate, HABIT_COLORS } from '../utils/date'
import { calcCurrentStreak } from '../utils/stats'
import StatsAdviceCard from './StatsAdviceCard'
import StatsWeekdayCard from './StatsWeekdayCard'
import StatsCategoryCard from './StatsCategoryCard'
import './StatsView.css'
import Modal from './Modal'

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

  return {
    rate: total > 0 ? Math.round((achieved / total) * 100) : null,
    achieved,
    total,
  }
}

function calcWeekdayRates(habits, records, today, days = 30, statsStartDate) {
  const end = parseLocalDate(today)
  const todayDow = end.getDay()
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

  return buckets.map((bucket, i) => ({
    label: bucket.label,
    rate: bucket.total > 0 ? Math.round((bucket.achieved / bucket.total) * 100) : null,
    isToday: i === todayDow,
  }))
}

function calcColorStats(habits, records, today, colorCategories, statsStartDate) {
  // #344: 分析では終了済み習慣も活動期間内の実績を含める
  // activeHabitのみではなく全habitを対象にし、isHabitActiveOnで期間フィルタ
  return HABIT_COLORS
    .filter(color => colorCategories[color]?.trim())
    .map(color => {
      const colorHabits = habits.filter(h => h.color === color)
      // カウントはアクティブなもののみ（終了済みは数の表示に含めない）
      const activeCount = colorHabits.filter(h => !h.archivedAt).length
      // 達成率は終了済みも含めた全体（活動期間内で計算）
      return {
        color,
        name: colorCategories[color],
        count: activeCount,
        rate: calcRateForRange(colorHabits, records, today, 30, statsStartDate).rate,
      }
    })
    .filter(c => c.count > 0)
    .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1))
}


export default function StatsView({ habits, records, today, colorCategories = {}, statsStartDate = null, asModal = false, onClose }) {
  const stats7 = calcRateForRange(habits, records, today, 7, statsStartDate)
  const rate7 = stats7.rate
  const stats30 = calcRateForRange(habits, records, today, 30, statsStartDate)
  const rate30 = stats30.rate
  const weekdayRates = calcWeekdayRates(habits, records, today, 30, statsStartDate)
  const colorStats = calcColorStats(habits, records, today, colorCategories, statsStartDate)
  const hasNamedColors = Object.values(colorCategories).some(v => v?.trim())

  const body = habits.length === 0 ? (
    <p className="analysis-empty">習慣を追加すると達成率が表示されます。</p>
  ) : (
    <>
      <StatsAdviceCard rate7={rate7} rate30={rate30} statsStartDate={statsStartDate} achieved7={stats7.achieved} total7={stats7.total} achieved30={stats30.achieved} total30={stats30.total} />

      {hasNamedColors && (
        <StatsCategoryCard colorStats={colorStats} />
      )}

      <StatsWeekdayCard weekdayRates={weekdayRates} />
    </>
  )

  if (asModal) {
    return (
      <Modal title="分析" onClose={onClose}>
        <div className="section-group">{body}</div>
      </Modal>
    )
  }
  return <div className="section-group">{body}</div>
}