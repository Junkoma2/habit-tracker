import './Calendar.css'

const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土']

function toDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function Calendar({ date, onDateChange, habits, records, today, onDayClick }) {
  const year = date.getFullYear()
  const month = date.getMonth()

  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  // Build cells: prev month tail → current month → next month head
  const cells = []

  for (let i = firstDow - 1; i >= 0; i--) {
    const d = prevMonthDays - i
    const y = month === 0 ? year - 1 : year
    const m = month === 0 ? 11 : month - 1
    cells.push({ y, m, d, other: true, dow: (firstDow - 1 - i) })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dow = (firstDow + d - 1) % 7
    cells.push({ y: year, m: month, d, other: false, dow })
  }

  // Fill trailing cells to complete last row
  const remaining = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7)
  const nextY = month === 11 ? year + 1 : year
  const nextM = month === 11 ? 0 : month + 1
  for (let d = 1; d <= remaining; d++) {
    cells.push({ y: nextY, m: nextM, d, other: true, dow: (firstDow + daysInMonth - 1 + d) % 7 })
  }

  const goToPrev = () => onDateChange(new Date(year, month - 1, 1))
  const goToNext = () => onDateChange(new Date(year, month + 1, 1))
  const goToToday = () => onDateChange(new Date())

  const pad = (n) => String(n).padStart(2, '0')
  const isCurrentMonth = today.startsWith(`${year}-${pad(month + 1)}`)

  return (
    <div className="calendar">
      <div className="calendar-nav">
        <button className="cal-nav-btn" onClick={goToPrev} aria-label="前の月">‹</button>
        <div className="cal-month-label">
          <span>{year}年{month + 1}月</span>
          {!isCurrentMonth && (
            <button className="today-jump-btn" onClick={goToToday} aria-label="今月へ戻る">
              今月へ
            </button>
          )}
        </div>
        <button className="cal-nav-btn" onClick={goToNext} aria-label="次の月">›</button>
      </div>

      <div className="calendar-grid">
        {DOW_LABELS.map((d, i) => (
          <div
            key={d}
            className={`cal-dow ${i === 0 ? 'sun' : ''} ${i === 6 ? 'sat' : ''}`}
          >
            {d}
          </div>
        ))}

        {cells.map(({ y, m, d, other, dow }) => {
          const dateStr = toDateStr(y, m, d)
          const isToday = dateStr === today
          const dayRecords = records[dateStr] || []
          const activeHabits = habits.filter(h => !h.createdAt || dateStr >= h.createdAt)
          const completedHabits = activeHabits.filter(h => dayRecords.includes(h.id))
          const total = activeHabits.length
          const count = completedHabits.length
          const allDone = total > 0 && count === total

          const label = `${y}年${m + 1}月${d}日${count > 0 ? `、${count}件達成` : ''}`
          return (
            <div
              key={dateStr}
              className={[
                'cal-cell',
                other ? 'other-month' : '',
                isToday ? 'today' : '',
                dow === 0 ? 'sun' : '',
                dow === 6 ? 'sat' : '',
              ].filter(Boolean).join(' ')}
              role="button"
              tabIndex={other ? -1 : 0}
              aria-label={label}
              onClick={() => onDayClick(dateStr)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDayClick(dateStr) } }}
            >
              <span className="cal-day-num">{d}</span>
              <div className="cal-dots">
                {completedHabits.map(h => (
                  <span
                    key={h.id}
                    className="cal-dot"
                    style={{ backgroundColor: h.color }}
                  />
                ))}
              </div>
              {total > 0 && count > 0 && (
                <span className={`cal-count ${allDone ? 'all' : ''}`}>
                  {count}/{total}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
