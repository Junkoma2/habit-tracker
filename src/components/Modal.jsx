import { useRef } from 'react'
import './Modal.css'

const CLOSE_THRESHOLD = 80

export default function Modal({ onClose, children, title }) {
  const sheetRef = useRef(null)
  const startYRef = useRef(0)
  const dragYRef = useRef(0)
  const draggingRef = useRef(false)

  const handleTouchStart = (e) => {
    if (sheetRef.current.scrollTop > 0) return
    startYRef.current = e.touches[0].clientY
    dragYRef.current = 0
    draggingRef.current = true
  }

  const handleTouchMove = (e) => {
    e.stopPropagation()
    if (!draggingRef.current) return
    if (sheetRef.current.scrollTop > 0) {
      draggingRef.current = false
      return
    }
    const dy = e.touches[0].clientY - startYRef.current
    if (dy <= 0) return
    dragYRef.current = dy
    sheetRef.current.style.transition = 'none'
    sheetRef.current.style.transform = `translateY(${dy}px)`
  }

  const handleTouchEnd = () => {
    if (!draggingRef.current) return
    draggingRef.current = false
    if (dragYRef.current > CLOSE_THRESHOLD) {
      sheetRef.current.style.transition = 'transform 0.2s ease'
      sheetRef.current.style.transform = 'translateY(100%)'
      setTimeout(onClose, 200)
    } else {
      sheetRef.current.style.transition = 'transform 0.2s ease'
      sheetRef.current.style.transform = 'translateY(0)'
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        ref={sheetRef}
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="modal-handle" />
        {title && <h2 className="modal-title">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
