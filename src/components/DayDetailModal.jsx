import Modal from './Modal'
import { formatDisplayDate, getToday, getYesterday } from '../utils/date'
import './DayDetailModal.css'

export default function DayDetailModal({
  dateStr,
  habits,
  completedIds,
  isEditable,
  onToggle,
  onClose,
}) {
  const today = getToday()
  const yesterday = getYesterday()

  const dateLabel =
    dateStr === today ? '今日' :
    dateStr === yesterday ? '昨日' : null

  const activeHabits = habits.filter(h => {
    if (h.createdAt && dateStr < h.createdAt) return false
    if (h.archivedAt && dateStr > h.archivedAt) return false
    return true
  })
  const completedCount = activeHabits.filter(h => completedIds.includes(h.id)).length

  return (
    <Modal onClose={onClose} title={formatDisplayDate(dateStr)}>
      {dateLabel && (
        <div className="day-badge">
          <span className={`badge ${dateLabel === '今日' ? 'today' : 'yesterday'}`}>
            {dateLabel}
          </span>
        </div>
      )}

      <div className="day-summary">
        <span className="summary-count">{completedCount}</span>
        <span className="summary-label"> / {activeHabits.length} 習慣達成</span>
      </div>

      {activeHabits.length === 0 ? (
        <p className="no-habits">習慣がまだ登録されていません</p>
      ) : (
        <ul className="day-habit-list">
          {activeHabits.map(habit => {
            const done = completedIds.includes(habit.id)
            return (
              <li key={habit.id} className="day-habit-item">
                <button
                  className={`day-habit-btn ${done ? 'done' : ''} ${!isEditable ? 'readonly' : ''}`}
                  style={{ '--color': habit.color }}
                  onClick={() => isEditable && onToggle(habit.id)}
                  disabled={!isEditable}
                >
                  <span
                    className="day-habit-dot"
                    style={{ backgroundColor: habit.color }}
                  />
                  <span className="day-habit-name">{habit.name}</span>
                  <span className={`day-habit-status ${done ? 'done' : ''}`}>
                    {done ? '✓' : '−'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {!isEditable && (
        <p className="edit-note">編集できるのは当日・前日のみです</p>
      )}

      <button className="day-close-btn" onClick={onClose}>
        閉じる
      </button>
    </Modal>
  )
}
