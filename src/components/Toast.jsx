import { useEffect } from 'react'
import './Toast.css'

export default function Toast({ message, action, onAction, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, action ? 4000 : 3000)
    return () => clearTimeout(timer)
  }, [message, action, onDismiss])

  return (
    <div className={`toast${action ? ' toast--action' : ''}`} role="status" aria-live="polite">
      <span>{message}</span>
      {action && (
        <button className="toast-action-btn" onClick={() => { onAction?.(); onDismiss(); }}>
          {action}
        </button>
      )}
    </div>
  )
}
