import { createContext, useContext, useRef, useEffect, useState, useCallback } from 'react'
import './Modal.css'

const CLOSE_THRESHOLD = 80
const CLOSE_DURATION = 280
const ModalCloseContext = createContext(null)

export function useModalClose() {
  return useContext(ModalCloseContext)
}

export default function Modal({ onClose, children, title }) {
  const [closing, setClosing] = useState(false)
  const sheetRef = useRef(null)
  const startYRef = useRef(0)
  const dragYRef = useRef(0)
  const draggingRef = useRef(false)
  const closeTimerRef = useRef(null)

  // アニメーション完了後にフォーカスを移動（重複effectを解消）
  useEffect(() => {
    const timer = setTimeout(() => sheetRef.current?.focus(), 220)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    document.documentElement.classList.add('modal-open')
    return () => document.documentElement.classList.remove('modal-open')
  }, [])

  useEffect(() => {
    return () => clearTimeout(closeTimerRef.current)
  }, [])

  const requestClose = useCallback(() => {
    if (closing) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose()
      return
    }
    setClosing(true)
    closeTimerRef.current = setTimeout(onClose, CLOSE_DURATION)
  }, [closing, onClose])

  const handleTouchStart = (e) => {
    if (closing) return
    if (sheetRef.current.scrollTop > 0) return
    startYRef.current = e.touches[0].clientY
    dragYRef.current = 0
    draggingRef.current = true
  }

  const handleTouchMove = (e) => {
    e.stopPropagation()
    if (closing) return
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
    if (closing) return
    if (!draggingRef.current) return
    draggingRef.current = false
    if (dragYRef.current > CLOSE_THRESHOLD) {
      sheetRef.current.style.transition = ''
      sheetRef.current.style.transform = ''
      requestClose()
    } else {
      sheetRef.current.style.transition = 'transform 0.28s ease'
      sheetRef.current.style.transform = 'translateY(0)'
    }
  }

  return (
    <div
      className={`modal-backdrop${closing ? ' closing' : ''}`}
      onClick={requestClose}
      onTouchMove={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <div
        ref={sheetRef}
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex="-1"
        data-closing={closing ? 'true' : undefined}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <ModalCloseContext.Provider value={requestClose}>
          <div className="modal-handle" />
          {title && <h2 className="modal-title">{title}</h2>}
          {children}
        </ModalCloseContext.Provider>
      </div>
    </div>
  )
}
