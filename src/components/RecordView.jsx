import Calendar from './Calendar'
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

function getRecentHistory(records, habits, limit = 5) {
  const habitMap = new Map(habits.map(habit => [habit.id, habit]))
  return Object.entries(records)
    .map(([date, ids]) => ({
      date,
      habits: [...new Set(ids)].map(id => habitMap.get(id)).filter(Boolean),
    }))
    .filter(item => item.habits.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
}

function formatShortDate(dateStr) {
  const [, month, day] = dateStr.split('-')
  return `${Number(month)}/${Number(day)}`
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
  const recentHistory = getRecentHistory(records, habits)

  const activeHabits = habits.filter(h => !h.archivedAt)

  // フェーズごとに習慣を分類
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
  // 各フェーズ内を連続日数降順にソート
  for (const label of PHASE_ORDER) {
    if (groupedByPhase[label]) {
      groupedByPhase[label].sort((a, b) => b.streak - a.streak)
    }
  }

  // フェーズハイライト：連続日数が最も長い習慣
  const featured = [...habitPhaseList].sort((a, b) => b.streak - a.streak)[0] ?? null

  return (
    <>
      {featured && (
        <section className="section record-phase-highlight-section">
          <div className="phase-highlight-label">{featured.phase.label}</div>
          <div className="phase-highlight-streak">{featured.streak > 0 ? `${featured.streak}日継続中` : '今日から始めよう'}</div>
          {featured.phase.daysToNext !== null && (
            <div className="phase-highlight-next">
              あと{featured.phase.daysToNext}日続けると「{featured.phase.next}」へ
            </div>
          )}
          {featured.streak > 0 && (
            <div className="phase-highlight-habit">
              <span className="phase-highlight-dot" style={{ backgroundColor: featured.habit.color }} />
              <span>{featured.habit.name}</span>
            </div>
          )}
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

      <section className="section record-history-section">
        <div className="section-header">
          <h2 className="section-title">達成履歴</h2>
        </div>
        {recentHistory.length > 0 ? (
          <div className="record-history-list">
            {recentHistory.map(item => (
              <button
                className="record-history-item"
                key={item.date}
                onClick={() => onDayClick(item.date)}
              >
                <span className="record-history-date">{formatShortDate(item.date)}</span>
                <span className="record-history-dots">
                  {item.habits.slice(0, 8).map(habit => (
                    <span
                      className="record-history-dot"
                      style={{ backgroundColor: habit.color }}
                      key={habit.id}
                    />
                  ))}
                </span>
                <span className="record-history-count">{item.habits.length}件</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="record-empty">記録が増えると、最近の達成がここに並びます。</p>
        )}
      </section>
    </>
  )
}
