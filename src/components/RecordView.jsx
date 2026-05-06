import Calendar from './Calendar'
import { calcStats } from '../utils/stats'
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
  const bestCurrent = habits.reduce((best, habit) => {
    const stats = calcStats(habit.id, records)
    return stats.current > best.current ? { habit, current: stats.current } : best
  }, { habit: null, current: 0 })
  const recentHistory = getRecentHistory(records, habits)

  return (
    <>
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
        </div>
        <div className="record-summary-grid">
          <div className="record-summary-card">
            <span className="record-summary-value">{monthCount}</span>
            <span className="record-summary-label">今月の達成</span>
          </div>
          <div className="record-summary-card">
            <span className="record-summary-value">{totalCount}</span>
            <span className="record-summary-label">総達成回数</span>
          </div>
          <div className="record-summary-card wide">
            <span className="record-summary-value">{bestCurrent.current}</span>
            <span className="record-summary-label">
              {bestCurrent.habit ? `${bestCurrent.habit.name}の連続記録` : '現在の連続記録'}
            </span>
          </div>
        </div>
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
