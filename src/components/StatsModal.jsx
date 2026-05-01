import Modal from './Modal'
import { formatDate, parseLocalDate } from '../utils/date'
import './StatsModal.css'

function calcStats(habitId, records) {
  const completedDates = Object.keys(records)
    .filter(date => (records[date] || []).includes(habitId))
    .sort()

  const total = completedDates.length
  if (total === 0) return { current: 0, longest: 0, total: 0 }

  let longest = 1, run = 1
  for (let i = 1; i < completedDates.length; i++) {
    const prev = parseLocalDate(completedDates[i - 1])
    const curr = parseLocalDate(completedDates[i])
    const diff = (curr - prev) / 86400000
    if (diff === 1) {
      run++
      if (run > longest) longest = run
    } else {
      run = 1
    }
  }

  let current = 0
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  while (true) {
    const dateStr = formatDate(d)
    if ((records[dateStr] || []).includes(habitId)) {
      current++
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }

  return { current, longest, total }
}

export default function StatsModal({ habits, records, onClose }) {
  return (
    <Modal onClose={onClose} title="統計">
      {habits.length === 0 ? (
        <p className="stats-empty">習慣を追加すると統計が表示されます。</p>
      ) : (
        <div className="stats-list">
          {habits.map(habit => {
            const { current, longest, total } = calcStats(habit.id, records)
            return (
              <div key={habit.id} className="stats-card">
                <div className="stats-habit-name">
                  <span className="stats-dot" style={{ backgroundColor: habit.color }} />
                  <span>{habit.name}</span>
                </div>
                <div className="stats-row">
                  <div className="stats-item">
                    <span className="stats-value">{current}</span>
                    <span className="stats-label">現在の連続</span>
                  </div>
                  <div className="stats-item">
                    <span className="stats-value">{longest}</span>
                    <span className="stats-label">最長連続</span>
                  </div>
                  <div className="stats-item">
                    <span className="stats-value">{total}</span>
                    <span className="stats-label">累計達成</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div className="stats-close-wrap">
        <button className="stats-close-btn" onClick={onClose}>閉じる</button>
      </div>
    </Modal>
  )
}
