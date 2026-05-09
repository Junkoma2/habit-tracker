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
      {onEdit && (
        <span
          className="habit-edit-icon"
          role="button"
          aria-label={`${habit.name}を編集`}
          onClick={(e) => { e.stopPropagation(); onEdit(habit) }}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </span>
      )}
      <span
        className="habit-dot"
        style={{ backgroundColor: completed ? '#fff' : habit.color }}
      />
      <span className="habit-name">{habit.name}</span>
      {streak > 1 && <span className="habit-streak">{streak}日継続</span>}
      {completed && <span className="habit-check">✓</span>}
    </button>
  )
}
