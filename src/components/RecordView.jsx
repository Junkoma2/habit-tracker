import { useState } from 'react'
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
  onDayClick,
  onMonthTitleClick,
  asModal = false,
  onClose,
}) {
  const [showMilestoneInfo, setShowMilestoneInfo] = useState(false)
  const monthKey = formatMonthKey(calendarDate)
  const monthCount = countRecordsInMonth(records, monthKey)
  const totalCount = countTotalRecords(records)

  const activeHabits = habits.filter(h => !h.archivedAt)

  const habitStreakList = activeHabits.map(habit => {
    const streak = calcCurrentStreakWithMode(habit.id, records, 'accumulate')
    return { habit, streak }
  })

  const sortedHabits = [...habitStreakList].sort((a, b) => b.streak - a.streak)

  const body = (
    <>
      {/* 習慣の進捗 */}
      {activeHabits.length > 0 && (
        <section className="section record-phase-highlight-section">
          <div className="section-header">
            <h2 className="section-title">習慣の進捗</h2>
            <button
              className="record-info-btn"
              onClick={() => setShowMilestoneInfo(true)}
              aria-label="マイルストンについて"
            >ⓘ</button>
          </div>
          <div className="progress-line-list">
            {sortedHabits.map(({ habit, streak }) => (
              <HabitProgressLine key={habit.id} habit={habit} streak={streak} />
            ))}
          </div>
        </section>
      )}

      {/* 継続ペース */}
      <section className="section record-summary-section">
        <div className="section-header">
          <h2 className="section-title">継続の記録</h2>
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
                        <span className="streak-summary-days">累計 {streak}日</span>
                        {next && (
                          <span className="streak-summary-next">次は{next.label}</span>
                        )}
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

  const milestoneInfoModal = showMilestoneInfo && (
    <Modal title="継続の目安について" onClose={() => setShowMilestoneInfo(false)}>
      <div className="milestone-info-content">
        <p>累計の達成日数が増えるにつれ、習慣は少しずつ自分の一部になっていきます。</p>
        <ul className="milestone-info-list">
          {MILESTONES.map(m => (
            <li key={m.days}>
              <span className="milestone-info-days">{m.days}日</span>
              <span className="milestone-info-desc">{m.desc}</span>
            </li>
          ))}
        </ul>
        <p className="milestone-info-note">続けるペースは人それぞれ。数字はあくまで目安です。</p>
      </div>
    </Modal>
  )

  if (asModal) {
    return (
      <>
        <Modal title="実績" onClose={onClose}>
          <div className="section-group">{body}</div>
        </Modal>
        {milestoneInfoModal}
      </>
    )
  }
  return (
    <>
      <div className="section-group">{body}</div>
      {milestoneInfoModal}
    </>
  )
}
