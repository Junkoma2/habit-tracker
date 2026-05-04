import { useEffect } from 'react'
import './Toast.css'

export default function Toast({ message, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [message, onDismiss])

  return (
    <div className="toast" role="status" aria-live="polite">
      {message}
    </div>
  )
}
