import Modal from './Modal'
import { calcStats, calcPeriodStats } from '../utils/stats'
import { getToday } from '../utils/date'
import './StatsModal.css'

export default function StatsModal({ habits, records, onClose }) {
  const today = getToday()
  return (
    <Modal onClose={onClose} title="統計">
      {habits.length === 0 ? (
        <p className="stats-empty">習慣を追加すると統計が表示されます。</p>
      ) : (
        <div className="stats-list">
          {habits.map(habit => {
            const { current, longest, total } = calcStats(habit.id, records)
            const { monthCount, rate30 } = calcPeriodStats(habit.id, records, today, habit.createdAt)
            return (
              <div key={habit.id} className="stats-card">
                <div className="stats-habit-name">
                  <span className="stats-dot" style={{ backgroundColor: habit.color }} />
                  <span>{habit.name}</span>
                  {habit.archivedAt && <span className="stats-archived-badge">終了</span>}
                </div>
                <div className="stats-row">
                  <div className="stats-item">
                    <div className="stats-value-row">
                      <span className="stats-value">{current}</span>
                      <span className="stats-unit">日</span>
                    </div>
                    <span className="stats-label">現在の連続</span>
                  </div>
                  <div className="stats-item">
                    <div className="stats-value-row">
                      <span className="stats-value">{longest}</span>
                      <span className="stats-unit">日</span>
                    </div>
                    <span className="stats-label">最長連続</span>
                  </div>
                  <div className="stats-item">
                    <div className="stats-value-row">
                      <span className="stats-value">{total}</span>
                      <span className="stats-unit">回</span>
                    </div>
                    <span className="stats-label">累計達成</span>
                  </div>
                </div>
                <div className="stats-row stats-row-period">
                  <div className="stats-item">
                    <div className="stats-value-row">
                      <span className="stats-value">{monthCount}</span>
                      <span className="stats-unit">日</span>
                    </div>
                    <span className="stats-label">今月達成</span>
                  </div>
                  <div className="stats-item">
                    <div className="stats-value-row">
                      <span className="stats-value">{rate30 !== null ? rate30 : '-'}</span>
                      {rate30 !== null && <span className="stats-unit">%</span>}
                    </div>
                    <span className="stats-label">直近30日</span>
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
