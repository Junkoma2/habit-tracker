import { useState, useCallback, useRef } from 'react'

const SWIPE_THRESHOLD_X = 72
const SWIPE_MAX_Y = 60

/**
 * 水平タブスワイプを管理するフック。
 *
 * 責務:
 * - タッチ開始時に水平スワイプか垂直スクロールかを判定
 * - 水平スワイプ中は tabDragX でリアルタイム追従
 * - タッチ終了時に SWIPE_THRESHOLD_X 超えでタブ切り替え
 * - モーダル/編集モード/ロック時はスワイプ無効
 *
 * NOTE: iPhone Safari では vertical scroll と水平スワイプが競合しやすいため、
 * touchmove のリスナーは passive: true で登録する。
 * （passive: false にすると縦スクロールがカクつく）
 */
export function useTabSwipe({ tabOrder, activeTab, onTabChange, disabled }) {
  const [tabDragX, setTabDragX] = useState(0)
  const [tabSettling, setTabSettling] = useState(false)
  const swipeRef = useRef(null)

  const handleStart = useCallback((e) => {
    if (
      disabled ||
      e.touches.length !== 1 ||
      e.target.closest('button, a, input, textarea, select, [contenteditable], [role="button"], .app-header, .app-footer, .modal-backdrop')
    ) {
      swipeRef.current = null
      return
    }

    const touch = e.touches[0]
    swipeRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      horizontal: false,
      activeIndex: tabOrder.indexOf(activeTab),
    }
  }, [disabled, tabOrder, activeTab])

  const handleMove = useCallback((e) => {
    const swipe = swipeRef.current
    if (!swipe || e.touches.length !== 1) return

    const touch = e.touches[0]
    const dx = touch.clientX - swipe.x
    const dy = touch.clientY - swipe.y

    // 最初の動き方向を確定（水平スワイプか縦スクロールか）
    if (!swipe.horizontal) {
      if (Math.abs(dx) > 18 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        swipe.horizontal = true
      } else if (Math.abs(dy) > 18 && Math.abs(dy) > Math.abs(dx)) {
        // 縦方向が先に確定 → スワイプをキャンセル
        swipeRef.current = null
        return
      }
    }

    if (swipe.horizontal) {
      const atFirst = swipe.activeIndex === 0 && dx > 0
      const atLast = swipe.activeIndex === tabOrder.length - 1 && dx < 0
      setTabSettling(false)
      // 端に達したときはゴムのように抵抗をかける
      setTabDragX((atFirst || atLast) ? dx * 0.28 : dx)
    }
  }, [tabOrder.length])

  const handleEnd = useCallback((e) => {
    const swipe = swipeRef.current
    swipeRef.current = null

    if (!swipe?.horizontal || disabled) {
      setTabDragX(0)
      return
    }

    const touch = e.changedTouches[0]
    const dx = touch.clientX - swipe.x
    const dy = touch.clientY - swipe.y
    setTabSettling(true)
    setTabDragX(0)

    if (Math.abs(dx) < SWIPE_THRESHOLD_X || Math.abs(dy) > SWIPE_MAX_Y) return

    const nextIndex = dx < 0 ? swipe.activeIndex + 1 : swipe.activeIndex - 1
    const nextTab = tabOrder[nextIndex]
    if (nextTab) onTabChange(nextTab)
  }, [disabled, tabOrder, onTabChange])

  return { tabDragX, tabSettling, setTabSettling, handleStart, handleMove, handleEnd }
}
