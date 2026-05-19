import { createContext, useContext, useRef, useEffect, useState, useCallback } from 'react'
import './Modal.css'

const CLOSE_THRESHOLD = 80
const CLOSE_DURATION = 280
const ModalCloseContext = createContext(null)

export function useModalClose() {
  return useContext(ModalCloseContext)
}

// モーダル内でフォーカス可能な要素を返す
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

function getFocusableElements(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS)).filter(
    (el) => !el.closest('[hidden]') && !el.closest('[aria-hidden="true"]')
  )
}

/**
 * 共通モーダルベースコンポーネント。
 *
 * 全モーダル（AddHabitModal / HelpModal / SettingsModal / ConfirmModal 等）はこのコンポーネントを使う。
 *
 * 共通で処理していること:
 * - safe-area: .modal-sheet の padding-bottom に env(safe-area-inset-bottom) を適用
 * - scroll: overscroll-behavior: contain でスクロール連鎖を防止
 * - animation: slideUp / slideDown + backdrop fade
 * - drag-to-close: 下スワイプで閉じる（scrollTop === 0 のときのみ）
 * - focus: アニメーション完了後に sheetRef へ focus（キーボード対応）
 * - focus-trap: Tabキーのフォーカスをモーダル内に限定
 * - iOS PWA: modal-open クラスで背後のスクロールをロック、テーマカラーを暗くする
 * - reduced-motion: prefers-reduced-motion 時はアニメーションをスキップ
 *
 * 新モーダルを追加するときはこのコンポーネントをラップするだけでよい。
 * safe-area / scroll / keyboard 対応は自動的に適用される。
 */
export default function Modal({ onClose, children, title }) {
  const [closing, setClosing] = useState(false)
  const sheetRef = useRef(null)
  const startYRef = useRef(0)
  const dragYRef = useRef(0)
  const draggingRef = useRef(false)
  const closeTimerRef = useRef(null)
  // requestClose を useEffect 内で安定参照するための ref
  const requestCloseRef = useRef(null)

  const requestClose = useCallback(() => {
    if (closing) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose()
      return
    }
    setClosing(true)
    closeTimerRef.current = setTimeout(onClose, CLOSE_DURATION)
  }, [closing, onClose])

  // ref を最新の requestClose で常に更新
  requestCloseRef.current = requestClose

  // アニメーション完了後にフォーカスを移動（重複effectを解消）
  useEffect(() => {
    const timer = setTimeout(() => sheetRef.current?.focus({ preventScroll: true }), 220)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // iOS PWA: .modal-open でバックグラウンドのスクロールを防ぐ
    document.documentElement.classList.add('modal-open')
    const meta = document.querySelector('meta[name="theme-color"]')
    const prevColor = meta?.getAttribute('content') ?? null
    // iOS PWA: status bar をモーダルの暗幕に合わせて暗くする
    meta?.setAttribute('content', '#000000')
    return () => {
      document.documentElement.classList.remove('modal-open')
      if (meta) {
        // テーマが変更されていた場合は変更後の primary を使う
        const current = getComputedStyle(document.documentElement)
          .getPropertyValue('--color-primary').trim()
        meta.setAttribute('content', current || prevColor)
      }
    }
  }, [])

  useEffect(() => {
    return () => clearTimeout(closeTimerRef.current)
  }, [])

  // フォーカストラップ: Tabキーをモーダル内でループさせる
  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        requestCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const focusable = getFocusableElements(sheet)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first || document.activeElement === sheet) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last || document.activeElement === sheet) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    sheet.addEventListener('keydown', handleKeyDown)
    return () => sheet.removeEventListener('keydown', handleKeyDown)
  }, [])

  // drag-to-close: scrollTop が 0 のときのみ下スワイプで閉じる
  const handleTouchStart = (e) => {
    if (closing) return
    if (sheetRef.current.scrollTop > 0) return
    startYRef.current = e.touches[0].clientY
    dragYRef.current = 0
    draggingRef.current = true
  }

  const handleTouchMove = (e) => {
    // モーダル内の touchmove が外側（タブスワイプ等）に伝播しないよう stopPropagation
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
        // backdrop の touchmove はデフォルト動作（iOS overscroll）を防ぐ
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
