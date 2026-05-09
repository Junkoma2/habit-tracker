import Modal from './Modal'
import './LongPressModal.css'

export default function LongPressModal({
  habit,
  today,
  yesterday,
  isCompletedToday,
  isCompletedYesterday,
  onSelect,
  onEdit,
  onClose,
}) {
  const days = [
    { dateStr: today, label: '今日', completed: isCompletedToday },
    { dateStr: yesterday, label: '昨日', completed: isCompletedYesterday },
  ]

  return (
    <Modal onClose={onClose} title={`「${habit.name}」の記録`}>
      <div className="lp-days">
        {days.map(({ dateStr, label, completed }) => {
          const unavailable = habit.createdAt && dateStr < habit.createdAt
          return (
            <button
              key={dateStr}
              className={`lp-day-btn ${completed ? 'completed' : ''} ${unavailable ? 'unavailable' : ''}`}
              style={{ '--color': habit.color }}
              onClick={() => onSelect(dateStr)}
              disabled={unavailable}
              aria-pressed={completed}
              aria-label={`${label}${unavailable ? '（対象外）' : completed ? '（達成済み）' : '（未記録）'}`}
            >
              <div className="lp-day-info">
                <span className="lp-day-label">{label}</span>
                <span className="lp-day-date">{formatShortDate(dateStr)}</span>
              </div>
              <div className={`lp-status ${completed ? 'done' : ''}`}>
                {unavailable ? '対象外' : completed ? '✓ 完了' : '未記録'}
              </div>
            </button>
          )
        })}
      </div>
      {onEdit && (
        <button className="lp-edit-btn" onClick={() => onEdit(habit)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          習慣を編集
        </button>
      )}
      <button className="lp-cancel-btn" onClick={onClose}>
        キャンセル
      </button>
    </Modal>
  )
}

function formatShortDate(dateStr) {
  const [, m, d] = dateStr.split('-')
  return `${Number(m)}月${Number(d)}日`
}
