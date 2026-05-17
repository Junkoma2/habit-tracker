import { useState, useEffect } from 'react'
import './AddToHomePrompt.css'

const DISMISSED_KEY = 'add-to-home-dismissed'

function isIos() {
  // iOS Safari のみ navigator.standalone が存在する
  return 'standalone' in window.navigator
}

function isStandalone() {
  if (window.navigator.standalone) return true
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  return false
}

function isDismissed() {
  try { return !!localStorage.getItem(DISMISSED_KEY) } catch { return false }
}

export default function AddToHomePrompt() {
  const [visible, setVisible] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const isIosDevice = isIos()

  useEffect(() => {
    if (isStandalone() || isDismissed()) return

    if (isIosDevice) {
      // iOS: 常にバナーを表示（beforeinstallpromptは使えない）
      setVisible(true)
      return
    }

    // Android/PC: beforeinstallpromptイベントを待つ
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [isIosDevice])

  if (!visible) return null

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, '1') } catch {}
    setVisible(false)
  }

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
    }
    setVisible(false)
  }

  return (
    <div className="add-to-home-prompt" role="banner">
      <span className="add-to-home-text">
        ホーム画面に追加するとアプリとして使えます
      </span>
      {isIosDevice ? (
        <span className="add-to-home-hint">「共有」→「ホーム画面に追加」</span>
      ) : deferredPrompt ? (
        <button className="add-to-home-install-btn" onClick={handleInstall}>
          追加する
        </button>
      ) : null}
      <button className="add-to-home-dismiss" onClick={handleDismiss} aria-label="閉じる">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
