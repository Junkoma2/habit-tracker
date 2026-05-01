import { useEffect } from 'react'
import './Modal.css'

export default function Modal({ onClose, children, title }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        className="modal-sheet"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <div className="modal-handle" />
        {title && <h2 className="modal-title">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
