import { useState } from 'react'
import './AddToHomePrompt.css'

const DISMISSED_KEY = 'add-to-home-dismissed'

function shouldShow() {
  // navigator.standalone は iOS Safari のみ存在する
  if (!('standalone' in window.navigator)) return false
  if (window.navigator.standalone) return false
  if (window.matchMedia('(display-mode: standalone)').matches) return false
  try { return !localStorage.getItem(DISMISSED_KEY) } catch { return false }
}

export default function AddToHomePrompt() {
  const [visible, setVisible] = useState(shouldShow)

  if (!visible) return null

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, '1') } catch {}
    setVisible(false)
  }

  return (
    <div className="add-to-home-prompt" role="banner">
      <span className="add-to-home-text">
        ホーム画面に追加するとアプリとして快適に使えます
      </span>
      <span className="add-to-home-hint">「共有」→「ホーム画面に追加」</span>
      <button className="add-to-home-dismiss" onClick={handleDismiss} aria-label="閉じる">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
