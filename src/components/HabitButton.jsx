import { useRef, useCallback, useState } from 'react'
import './HabitButton.css'

const LONG_PRESS_DELAY = 500

export default function HabitButton({ habit, completed, streak, onPress, onLongPress, onEdit }) {
  const timerRef = useRef(null)
  const isLongPressRef = useRef(false)
  const startPosRef = useRef(null)
  const [popping, setPopping] = useState(false)

  const handlePointerDown = useCallback((e) => {
    isLongPressRef.current = false
    startPosRef.current = { x: e.clientX, y: e.clientY }
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      onLongPress(habit)
    }, LONG_PRESS_DELAY)
  }, [habit, onLongPress])

  const handlePointerMove = useCallback((e) => {
    if (!startPosRef.current) return
    const dx = Math.abs(e.clientX - startPosRef.current.x)
    const dy = Math.abs(e.clientY - startPosRef.current.y)
    if (dx > 8 || dy > 8) {
      clearTimeout(timerRef.current)
      isLongPressRef.current = true
    }
  }, [])

  const handlePointerUp = useCallback(() => {
    clearTimeout(timerRef.current)
    startPosRef.current = null
  }, [])

  const handlePointerCancel = useCallback(() => {
    clearTimeout(timerRef.current)
    isLongPressRef.current = true
    startPosRef.current = null
  }, [])

  const handleClick = useCallback(() => {
    if (!isLongPressRef.current) {
      if (!completed) {
        setPopping(true)
        if (navigator.vibrate) navigator.vibrate(30)
        setTimeout(() => setPopping(false), 300)
      }
      onPress(habit)
    }
    isLongPressRef.current = false
  }, [habit, onPress, completed])

  return (
    <div className="habit-btn-wrapper">
      <button
        className={`habit-btn${completed ? ' completed' : ''}${popping ? ' pop' : ''}`}
        style={{ '--color': habit.color }}
        aria-label={`${habit.name}${completed ? '（達成済み）' : ''}`}
        aria-pressed={completed}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span
          className="habit-dot"
          style={{ backgroundColor: completed ? '#fff' : habit.color }}
        />
        <span className="habit-name">{habit.name}</span>
        {streak > 1 && <span className="habit-streak">{streak}日継続</span>}
        {completed && <span className="habit-check">✓</span>}
      </button>
      {onEdit && (
        <button
          className="habit-edit-btn"
          onClick={() => onEdit(habit)}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={`${habit.name}を編集`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      )}
    </div>
  )
}
