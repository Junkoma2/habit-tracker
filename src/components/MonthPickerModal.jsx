import { useState } from 'react'
import Modal from './Modal'
import './MonthPickerModal.css'

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

export default function MonthPickerModal({ currentDate, onSelect, onClose }) {
  const [pickerYear, setPickerYear] = useState(currentDate.getFullYear())
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  const today = new Date()
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth()

  // 選択可能な年の範囲: 今年を基準に±5年
  const MIN_YEAR = todayYear - 5
  const MAX_YEAR = todayYear + 1

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
            return (
              <button
                key={m}
                className={[
                  'month-picker-cell',
                  isSelected ? 'selected' : '',
                  isToday && !isSelected ? 'today' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => { onSelect(pickerYear, m); onClose() }}
                aria-label={`${pickerYear}年${m + 1}月`}
                aria-pressed={isSelected}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
