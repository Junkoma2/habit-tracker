import { formatDate, parseLocalDate, HABIT_COLORS } from '../utils/date'
import { calcCurrentStreak, PHASES, getPhase, getHabitPhase } from '../utils/stats'
import StatsAdviceCard from './StatsAdviceCard'
import StatsWeekdayCard from './StatsWeekdayCard'
import StatsCategoryCard from './StatsCategoryCard'
import './StatsView.css'

const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土']
const ROUTE_MILESTONES = PHASES
  .filter(phase => Number.isFinite(phase.days))
  .map(phase => ({ days: phase.days, label: `${phase.days}日` }))

function calcRouteProgress(streak) {
  if (ROUTE_MILESTONES.length === 0) return 0

  let previousDays = 0
  let previousPosition = 0
  const segmentWidth = 100 / ROUTE_MILESTONES.length

  for (let i = 0; i < ROUTE_MILESTONES.length; i++) {
    const milestone = ROUTE_MILESTONES[i]
    const nextPosition = segmentWidth * (i + 1)

    if (streak <= milestone.days) {
      const daysInSegment = milestone.days - previousDays
      const segmentProgress = daysInSegment > 0
        ? (streak - previousDays) / daysInSegment
        : 1
      return Math.max(0, Math.min(100, previousPosition + segmentProgress * segmentWidth))
    }

    previousDays = milestone.days
    previousPosition = nextPosition
  }

  return 100
}

function PhaseRoute({ streak }) {
  const progress = calcRouteProgress(streak)

  return (
    <div
      className="phase-route"
      aria-label={`習慣化の進捗 ${Math.round(progress)}%`}
    >
      <div className="phase-route-line" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="phase-route-milestones">
        {ROUTE_MILESTONES.map(milestone => (
          <span
            key={milestone.days}
            className={`phase-route-milestone${streak >= milestone.days ? ' achieved' : ''}`}
            aria-label={`${milestone.label}${streak >= milestone.days ? ' 到達済み' : ' 未到達'}`}
          >
            <span className="phase-route-dot" />
            <span className="phase-route-label">{milestone.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

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
    .map(h => {
      const streak = calcCurrentStreak(h.id, records)
      return { habit: h, streak, phaseInfo: getHabitPhase(streak), ...getPhase(streak) }
    })
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
        <section className="section">
          <div className="analysis-subhead">
            <span>習慣化フェーズ</span>
          </div>
          <div className="phase-list">
            {habitPhases.map(({ habit, streak, phaseInfo }) => (
              <div key={habit.id} className="phase-row">
                <span className="phase-dot" style={{ backgroundColor: habit.color }} />
                <div className="phase-row-info">
                  <span className="phase-name">{habit.name}</span>
                  <PhaseRoute streak={streak} />
                  {phaseInfo.daysToNext !== null && (
                    <span className="phase-next-hint">あと{phaseInfo.daysToNext}日で「{phaseInfo.next}」へ</span>
                  )}
                </div>
                <span className="phase-streak">{streak > 0 ? `${streak}日` : '未開始'}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="analysis-note section">
        今の対象習慣は {activeHabits.length} 件です。達成率は、その日に対象だった習慣だけで計算しています。
      </p>
    </>
  )
}
