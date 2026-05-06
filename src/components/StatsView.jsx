import { formatDate, parseLocalDate } from '../utils/date'
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

function getAdvice(rate30) {
  if (rate30 === null) {
    return '記録が増えると、続け方のヒントがここに表示されます。'
  }
  if (rate30 >= 80) {
    return 'かなり安定して続けられています。今のペースを維持しましょう。'
  }
  if (rate30 >= 50) {
    return 'まずまず続けられています。無理に増やさず、今の習慣を整えましょう。'
  }
  return '少し負担が大きいかもしれません。習慣を小さくするのがおすすめです。'
}

export default function StatsView({ habits, records, today }) {
  const activeHabits = habits.filter(habit => !habit.archivedAt)
  const rate7 = calcRateForRange(habits, records, today, 7)
  const rate30 = calcRateForRange(habits, records, today, 30)
  const weekdayRates = calcWeekdayRates(habits, records, today)
  const advice = getAdvice(rate30)

  if (habits.length === 0) {
    return <p className="analysis-empty">習慣を追加すると、続け方のヒントが表示されます。</p>
  }

  return (
    <div className="analysis-content">
      <div className="analysis-advice">
        <span className="analysis-advice-label">次の続け方</span>
        <p>{advice}</p>
      </div>

      <div className="analysis-rate-grid">
        <div className="analysis-rate-card">
          <span className="analysis-rate-value">{rate7 ?? '-'}</span>
          {rate7 !== null && <span className="analysis-rate-unit">%</span>}
          <span className="analysis-rate-label">直近7日</span>
        </div>
        <div className="analysis-rate-card">
          <span className="analysis-rate-value">{rate30 ?? '-'}</span>
          {rate30 !== null && <span className="analysis-rate-unit">%</span>}
          <span className="analysis-rate-label">直近30日</span>
        </div>
      </div>

      <div className="analysis-weekday">
        <div className="analysis-subhead">
          <span>曜日別達成率</span>
          <small>直近30日</small>
        </div>
        <div className="analysis-weekday-list">
          {weekdayRates.map(item => (
            <div className="analysis-weekday-row" key={item.label}>
              <span className="analysis-weekday-label">{item.label}</span>
              <div className="analysis-weekday-bar">
                <span style={{ width: `${item.rate ?? 0}%` }} />
              </div>
              <span className="analysis-weekday-rate">{item.rate !== null ? `${item.rate}%` : '-'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="analysis-note">
        今の対象習慣は {activeHabits.length} 件です。達成率は、その日に対象だった習慣だけで計算しています。
      </div>
    </div>
  )
}
