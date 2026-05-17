import Calendar from './Calendar'
import Modal from './Modal'
import HabitProgressLine from './HabitProgressLine'
import { calcCurrentStreakWithMode, MILESTONES, getNextMilestone } from '../utils/stats'
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

// 現在地（継続日数）と次のマイルストンを返す
// #293: フェーズ名ではなく「現在日数 + 次の目標」を表示する
function getStreakDisplay(streak) {
  if (streak === 0) return { current: null, next: null }
  const next = getNextMilestone(streak)
  const reachedMilestones = MILESTONES.filter(m => streak >= m.days)
  const currentLabel = reachedMilestones.length > 0
    ? reachedMilestones[reachedMilestones.length - 1].label
    : null
  return { currentLabel, next }
}

export default function RecordView({
  calendarDate,
  onCalendarDateChange,
  habits,
  records,
  today,
  streakMode = 'decrement',
  onDayClick,
  onMonthTitleClick,
  asModal = false,
  onClose,
}) {
  const monthKey = formatMonthKey(calendarDate)
  const monthCount = countRecordsInMonth(records, monthKey)
  const totalCount = countTotalRecords(records)

  const activeHabits = habits.filter(h => !h.archivedAt)

  const habitStreakList = activeHabits.map(habit => {
    const streak = calcCurrentStreakWithMode(habit.id, records, streakMode)
    return { habit, streak }
  })

  const sortedHabits = [...habitStreakList].sort((a, b) => b.streak - a.streak)

  const body = (
    <>
      {/* #272: カレンダーを今日の習慣の直後（最上部）に配置 */}
      <section className="section record-calendar-section">
        <div className="section-header">
          <h2 className="section-title">カレンダー</h2>
        </div>
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

      {/* 習慣の進捗 */}
      {activeHabits.length > 0 && (
        <section className="section record-phase-highlight-section">
          <div className="section-header">
            <h2 className="section-title">習慣の進捗</h2>
          </div>
          <div className="progress-line-list">
            {sortedHabits.map(({ habit, streak }) => (
              <HabitProgressLine key={habit.id} habit={habit} streak={streak} />
            ))}
          </div>
        </section>
      )}

      {/* 積み上がり */}
      <section className="section record-summary-section">
        <div className="section-header">
          <h2 className="section-title">{streakMode === 'reset' ? '連続日数' : '積み上がり'}</h2>
          <div className="record-mini-stats">
            <span>{monthCount}回 今月</span>
            <span>累計 {totalCount}回</span>
          </div>
        </div>

        {activeHabits.length === 0 ? (
          <p className="record-empty">習慣を追加すると続いた日数が表示されます。</p>
        ) : (
          <div className="streak-summary-list">
            {sortedHabits.map(({ habit, streak }) => {
              const { currentLabel, next } = getStreakDisplay(streak)
              return (
                <div key={habit.id} className="streak-summary-row">
                  <span className="streak-summary-dot" style={{ backgroundColor: habit.color }} />
                  <span className="streak-summary-name">{habit.name}</span>
                  <div className="streak-summary-right">
                    {streak > 0 ? (
                      <>
                        <span className="streak-summary-days">{streak}日継続中</span>
                        {next ? (
                          <span className="streak-summary-next">次は{next.label}</span>
                        ) : currentLabel ? (
                          <span className="streak-summary-next streak-summary-next--done">{currentLabel} 達成</span>
                        ) : null}
                      </>
                    ) : (
                      <span className="streak-summary-days">まだ記録なし</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </>
  )

  if (asModal) {
    return (
      <Modal title="実績" onClose={onClose}>
        {body}
      </Modal>
    )
  }
  return body
}