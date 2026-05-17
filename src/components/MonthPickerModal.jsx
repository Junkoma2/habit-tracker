import { useMemo, useState } from 'react'
import Modal from './Modal'
import { MONTH_LABELS } from '../utils/date'
import './MonthPickerModal.css'

export default function MonthPickerModal({ currentDate, records, onSelect, onClose }) {
  const [pickerYear, setPickerYear] = useState(currentDate.getFullYear())
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  const today = new Date()
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth()

  // 選択可能な年の範囲: 今年を基準に±5年
  const MIN_YEAR = todayYear - 5
  const MAX_YEAR = todayYear + 1
  const recordMonths = useMemo(() => {
    const months = new Set()
    for (const [date, ids] of Object.entries(records)) {
      if (ids.length > 0) months.add(date.slice(0, 7))
    }
    return months
  }, [records])

  return (
    <Modal onClose={onClose} title="年月を選ぶ">
      <div className="month-picker">
        <div className="month-picker-year-nav">
          <button
            className="month-picker-year-btn"
            onClick={() => setPickerYear(y => Math.max(MIN_YEAR, y - 1))}
            disabled={pickerYear <= MIN_YEAR}
            aria-label="前の年"
          >
            ‹
          </button>
          <span className="month-picker-year-label">{pickerYear}年</span>
          <button
            className="month-picker-year-btn"
            onClick={() => setPickerYear(y => Math.min(MAX_YEAR, y + 1))}
            disabled={pickerYear >= MAX_YEAR}
            aria-label="次の年"
          >
            ›
          </button>
        </div>

        <button
          className="month-picker-today-btn"
          onClick={() => { onSelect(todayYear, todayMonth); onClose() }}
        >
          今月へ
        </button>

        <div className="month-picker-grid">
          {MONTH_LABELS.map((label, m) => {
            const isSelected = pickerYear === currentYear && m === currentMonth
            const isToday = pickerYear === todayYear && m === todayMonth
            const monthKey = `${pickerYear}-${String(m + 1).padStart(2, '0')}`
            const hasRecords = recordMonths.has(monthKey)
            return (
              <button
                key={m}
                className={[
                  'month-picker-cell',
                  isSelected ? 'selected' : '',
                  isToday && !isSelected ? 'today' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => { onSelect(pickerYear, m); onClose() }}
                aria-label={`${pickerYear}年${m + 1}月${hasRecords ? '、記録あり' : ''}`}
                aria-pressed={isSelected}
              >
                <span>{label}</span>
                {hasRecords && <span className="month-record-dot" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
