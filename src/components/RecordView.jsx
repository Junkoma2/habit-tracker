import Calendar from './Calendar'
import HabitProgressLine from './HabitProgressLine'
import { calcCurrentStreak, MILESTONES } from '../utils/stats'
import './RecordView.css'

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

// 達成したマイルストン数をラベル付きで返す
function getMilestoneLabel(streak) {
  const reached = MILESTONES.filter(m => streak >= m.days)
  if (reached.length === 0) return null
  return reached[reached.length - 1].label
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
    const milestoneLabel = getMilestoneLabel(streak)
    return { habit, streak, milestoneLabel }
  })

  const sortedHabits = [...habitPhaseList].sort((a, b) => b.streak - a.streak)

  return (
    <>
      {/* #278/#280: 実績画面の役割を明確にするヘッダー */}
      <div className="record-section-header">
        <h2 className="section-title">実績</h2>
      </div>
      {/* #272: カレンダーを今日の習慣の直後（最上部）に配置 */}
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

      {/* 習慣の進捗（#272: カレンダーの後に移動） */}
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

      {/* 積み上がり（#273: マイルストン到達ラベルで表示） */}
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
          <div className="streak-summary-list">
            {sortedHabits.map(({ habit, streak, milestoneLabel }) => (
              <div key={habit.id} className="streak-summary-row">
                <span className="streak-summary-dot" style={{ backgroundColor: habit.color }} />
                <span className="streak-summary-name">{habit.name}</span>
                <div className="streak-summary-right">
                  {milestoneLabel && (
                    <span className="streak-summary-milestone">{milestoneLabel}</span>
                  )}
                  {/* #274: streak 0 のとき「未開始」ではなく空欄にしてやわらかく */}
                  <span className="streak-summary-days">
                    {streak > 0 ? `${streak}日継続中` : 'まだ記録なし'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
