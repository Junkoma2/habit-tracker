import Modal from './Modal'
import './LongPressModal.css'

export default function LongPressModal({
  habit,
  today,
  yesterday,
  isCompletedToday,
  isCompletedYesterday,
  onSelect,
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
