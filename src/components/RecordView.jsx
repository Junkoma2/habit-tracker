import Calendar from './Calendar'
import HabitProgressLine from './HabitProgressLine'
import { calcCurrentStreak, getHabitPhase } from '../utils/stats'
import './RecordView.css'

const PHASE_ORDER = ['生活の一部', '日常に馴染んできた', 'リズムができてきた', 'まず2週間続けてみよう']

function formatMonthKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function countRecordsInMonth(records, monthKey) {
  return Object.entries(records).reduce((total, [date, ids]) => {
    if (!date.startsWith(monthKey)) return total
    return total + new Set(ids).size
  }, 0)
}

function countTotalRecords(records) {
  return Object.values(records).reduce((total, ids) => total + new Set(ids).size, 0)
}

export default function RecordView({
  calendarDate,
  onCalendarDateChange,
  habits,
  records,
  today,
  onDayClick,
  onMonthTitleClick,
}) {
  const monthKey = formatMonthKey(calendarDate)
  const monthCount = countRecordsInMonth(records, monthKey)
  const totalCount = countTotalRecords(records)

  const activeHabits = habits.filter(h => !h.archivedAt)

  const habitPhaseList = activeHabits.map(habit => {
    const streak = calcCurrentStreak(habit.id, records)
    return { habit, streak, phase: getHabitPhase(streak) }
  })

  const groupedByPhase = {}
  for (const item of habitPhaseList) {
    const label = item.phase.label
    if (!groupedByPhase[label]) groupedByPhase[label] = []
    groupedByPhase[label].push(item)
  }
  for (const label of PHASE_ORDER) {
    if (groupedByPhase[label]) {
      groupedByPhase[label].sort((a, b) => b.streak - a.streak)
    }
  }

  const sortedHabits = [...habitPhaseList].sort((a, b) => b.streak - a.streak)

  return (
    <>
      {activeHabits.length > 0 && (
        <section className="section record-phase-highlight-section">
          <div className="phase-highlight-heading">習慣の進捗</div>
          <div className="progress-line-list">
            {sortedHabits.map(({ habit, streak }) => (
              <HabitProgressLine key={habit.id} habit={habit} streak={streak} />
            ))}
          </div>
        </section>
      )}

      <section className="section record-calendar-section">
        <Calendar
          date={calendarDate}
          onDateChange={onCalendarDateChange}
          habits={habits}
          records={records}
          today={today}
          onDayClick={onDayClick}
          onMonthTitleClick={onMonthTitleClick}
        />
      </section>

      <section className="section record-summary-section">
        <div className="section-header">
          <h2 className="section-title">積み上がり</h2>
          <div className="record-mini-stats">
            <span>{monthCount}回 今月</span>
            <span>累計 {totalCount}回</span>
          </div>
        </div>

        {activeHabits.length === 0 ? (
          <p className="record-empty">習慣を追加すると、積み上がりがここに表示されます。</p>
        ) : (
          <div className="phase-groups">
            {PHASE_ORDER.map(phaseLabel => {
              const items = groupedByPhase[phaseLabel]
              if (!items || items.length === 0) return null
              return (
                <div key={phaseLabel} className="phase-group">
                  <h3 className="phase-group-title">{phaseLabel}</h3>
                  {items.map(({ habit, streak, phase }) => (
                    <div key={habit.id} className="phase-habit-row">
                      <span className="phase-habit-dot" style={{ backgroundColor: habit.color }} />
                      <div className="phase-habit-info">
                        <span className="phase-habit-name">{habit.name}</span>
                        {streak > 0 && <span className="phase-habit-streak">{streak}日継続中</span>}
                        {phase.daysToNext !== null && (
                          <span className="phase-habit-next">あと{phase.daysToNext}日で「{phase.next}」へ</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}
