import { useRef, useCallback } from 'react'
import './HabitButton.css'

const LONG_PRESS_DELAY = 500

export default function HabitButton({ habit, completed, onPress, onLongPress }) {
  const timerRef = useRef(null)
  const isLongPressRef = useRef(false)
  const startPosRef = useRef(null)

  const startPress = useCallback((clientX, clientY) => {
    isLongPressRef.current = false
    startPosRef.current = { x: clientX, y: clientY }
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      onLongPress(habit)
    }, LONG_PRESS_DELAY)
  }, [habit, onLongPress])

  const endPress = useCallback(() => {
    clearTimeout(timerRef.current)
    if (!isLongPressRef.current) {
      onPress(habit)
    }
  }, [habit, onPress])

  const cancelPress = useCallback(() => {
    clearTimeout(timerRef.current)
    isLongPressRef.current = true
  }, [])

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    startPress(touch.clientX, touch.clientY)
  }, [startPress])

  const handleTouchMove = useCallback((e) => {
    if (!startPosRef.current) return
    const touch = e.touches[0]
    const dx = Math.abs(touch.clientX - startPosRef.current.x)
    const dy = Math.abs(touch.clientY - startPosRef.current.y)
    if (dx > 8 || dy > 8) cancelPress()
  }, [cancelPress])

  const handleMouseDown = useCallback((e) => {
    startPress(e.clientX, e.clientY)
  }, [startPress])

  return (
    <button
      className={`habit-btn ${completed ? 'completed' : ''}`}
      style={{ '--color': habit.color }}
      onMouseDown={handleMouseDown}
      onMouseUp={endPress}
      onMouseLeave={cancelPress}
      onTouchStart={handleTouchStart}
      onTouchEnd={endPress}
      onTouchMove={handleTouchMove}
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
