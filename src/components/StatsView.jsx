import { formatDate, parseLocalDate, HABIT_COLORS } from '../utils/date'
import { calcCurrentStreak } from '../utils/stats'
import { PHASES, getPhase } from '../utils/habitPhase'
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

export default function StatsView({ habits, records, today, colorCategories = {} }) {
  const activeHabits = habits.filter(habit => !habit.archivedAt)
  const rate7 = calcRateForRange(habits, records, today, 7)
  const rate30 = calcRateForRange(habits, records, today, 30)
  const weekdayRates = calcWeekdayRates(habits, records, today)
  const advice = getAdvice(rate7)
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
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">達成率</h2>
        </div>
        <div className="analysis-advice">
          <span className="analysis-advice-label">直近7日の傾向</span>
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
      </section>

      {hasNamedColors && (
        <section className="section">
          <div className="analysis-subhead">
            <span>カテゴリ別達成率</span>
            <small>直近30日</small>
          </div>
          {colorStats.length === 0 ? (
            <p className="analysis-note">カテゴリが設定された色の習慣がありません。</p>
          ) : (
            <div className="analysis-color-list">
              {colorStats.map(({ color, name, count, rate }) => (
                <div className="analysis-color-row" key={color}>
                  <span className="analysis-color-dot" style={{ backgroundColor: color }} />
                  <span className="analysis-color-name">{name}</span>
                  <span className="analysis-color-count">{count}件</span>
                  <div className="analysis-weekday-bar">
                    <span style={{ width: `${rate ?? 0}%` }} />
                  </div>
                  <span className="analysis-color-rate">{rate !== null ? `${rate}%` : '-'}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="section">
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
      </section>

      {habitPhases.length > 0 && (
        <section className="section">
          <div className="analysis-subhead">
            <span>習慣化フェーズ</span>
          </div>
          <div className="phase-scale">
            {PHASES.slice(0, -1).map((p, i) => (
              <span key={i} className="phase-scale-label">{p.days}日</span>
            ))}
          </div>
          <div className="phase-list">
            {habitPhases.map(({ habit, streak, phase, index }) => (
              <div key={habit.id} className="phase-row">
                <span className="phase-dot" style={{ backgroundColor: habit.color }} />
                <span className="phase-name">{habit.name}</span>
                <span className="phase-tag" style={{ color: habit.color, borderColor: habit.color }}>
                  {phase.label}
                </span>
                <span className="phase-streak">{streak}日</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="analysis-note">
        今の対象習慣は {activeHabits.length} 件です。達成率は、その日に対象だった習慣だけで計算しています。
      </p>
    </>
  )
}
