import './ArchivedHabitItem.css'

export default function ArchivedHabitItem({ habit, onRestore, onDelete }) {
  return (
    <div className="archived-habit-item">
      <span className="archived-habit-dot" style={{ backgroundColor: habit.color }} />
      <span className="archived-habit-name">{habit.name}</span>
      {habit.archivedAt && (
        <span className="archived-habit-date">{habit.archivedAt}</span>
      )}
      <button
        className="archived-action restore"
        onClick={() => onRestore(habit)}
        aria-label={`${habit.name}を再開`}
      >
        再開
      </button>
      <button
        className="archived-action delete"
        onClick={() => onDelete(habit)}
        aria-label={`${habit.name}を削除`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </button>
    </div>
  )
}
