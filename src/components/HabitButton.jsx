import { useRef, useCallback } from 'react'
import './HabitButton.css'

const LONG_PRESS_DELAY = 500

export default function HabitButton({ habit, completed, onPress, onLongPress }) {
  const timerRef = useRef(null)
  const isLongPressRef = useRef(false)
  const startPosRef = useRef(null)

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
      onPress(habit)
    }
    isLongPressRef.current = false
  }, [habit, onPress])

  return (
    <button
      className={`habit-btn ${completed ? 'completed' : ''}`}
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
      {completed && <span className="habit-check">✓</span>}
    </button>
  )
}
