import { useState, useRef, useCallback, useEffect } from 'react'

export const PULL_THRESHOLD = 80
// 通常のpull-to-refreshよりさらに深く引いたときのしきい値
export const DEEP_PULL_THRESHOLD = 150

export function usePullToRefresh({ mainRef, scrollKey, onRefresh }) {
  const [pullY, setPullY] = useState(0)
  const [pullReturning, setPullReturning] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshComplete, setRefreshComplete] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showDeepTip, setShowDeepTip] = useState(false)

  const pullStartY = useRef(null)
  const justScrolledToTop = useRef(false)
  const scrollStopTimer = useRef(null)
  const deepPullTriggered = useRef(false)

  useEffect(() => {
    const scrollEl = mainRef.current
    if (!scrollEl) return

    const onScroll = () => {
      if (scrollEl.scrollTop > 0) {
        setScrolled(true)
        justScrolledToTop.current = true
        clearTimeout(scrollStopTimer.current)
      } else {
        setScrolled(false)
        scrollStopTimer.current = setTimeout(() => {
          justScrolledToTop.current = false
        }, 300)
      }
    }
    scrollEl.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => scrollEl.removeEventListener('scroll', onScroll)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainRef, scrollKey])

  const handleTouchStart = useCallback((e) => {
    // ヘッダー上のタッチはpull-to-refreshを起動しない
    if (e.target.closest('.app-header')) return
    // スクロール戻り直後はpull-to-refreshを許可しない
    if ((mainRef.current?.scrollTop ?? 0) === 0 && !justScrolledToTop.current) {
      pullStartY.current = e.touches[0].clientY
      deepPullTriggered.current = false
    }
  }, [mainRef])

  const handleTouchMove = useCallback((e) => {
    if (pullStartY.current === null) return
    const dy = e.touches[0].clientY - pullStartY.current
    if (dy > 0) {
      const visual = dy * 0.4
      // しきい値以降はゴムのように強い抵抗をかけて最大50px追加で引ける
      const clamped = visual <= PULL_THRESHOLD
        ? visual
        : Math.min(PULL_THRESHOLD + (visual - PULL_THRESHOLD) * 0.3, PULL_THRESHOLD + 50)
      setPullY(clamped)

      // 深いスワイプ検知: 元の指の移動量がDEEP_PULL_THRESHOLD/0.4を超えたとき
      const rawDy = dy
      if (rawDy >= DEEP_PULL_THRESHOLD && !deepPullTriggered.current) {
        deepPullTriggered.current = true
        setShowDeepTip(true)
      }
    } else {
      pullStartY.current = null
      setPullY(0)
    }
  }, [])

  const handleTouchEnd = useCallback(async () => {
    deepPullTriggered.current = false
    if (pullY >= PULL_THRESHOLD) {
      setRefreshing(true)
      setPullY(0)

      let swUpdated = false
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.getRegistration()
          if (reg) {
            swUpdated = await new Promise(resolve => {
              let done = false
              let fallbackTimer
              const finish = (val) => {
                if (!done) {
                  done = true
                  clearTimeout(fallbackTimer)
                  resolve(val)
                }
              }
              fallbackTimer = setTimeout(() => finish(false), 1500)

              // controllerchange: skipWaiting+clients.claim で即座にアクティベートされた場合も検知できる
              navigator.serviceWorker.addEventListener('controllerchange', () => finish(true), { once: true })

              reg.update()
                .then(() => {
                  const sw = reg.installing || reg.waiting
                  if (sw) {
                    sw.addEventListener('statechange', function handler() {
                      if (this.state === 'activated') {
                        sw.removeEventListener('statechange', handler)
                        finish(true)
                      }
                    })
                  }
                  // update()完了から1秒待ってもchangeがなければ更新なし
                  setTimeout(() => finish(false), 1000)
                })
                .catch(() => finish(false))
            })
          }
        } catch {}
      }

      onRefresh()
      setTimeout(() => {
        setRefreshComplete(true)
        setTimeout(() => {
          // .returning を先に付与してから refreshing を落とすことで
          // CSS height: 60px → inline 0px のトランジションを確実に起動する
          setPullReturning(true)
          requestAnimationFrame(() => {
            setRefreshing(false)
            if (swUpdated) window.location.reload()
            setTimeout(() => {
              setPullReturning(false)
              setRefreshComplete(false)
            }, 700)
          })
        }, 380)
      }, 700)
    } else {
      setPullReturning(true)
      requestAnimationFrame(() => {
        setPullY(0)
        setTimeout(() => setPullReturning(false), 400)
      })
    }
    pullStartY.current = null
    // deep tipは2秒後に自動的に消す
    if (showDeepTip) {
      setTimeout(() => setShowDeepTip(false), 2500)
    }
  }, [pullY, onRefresh, showDeepTip])

  return {
    pullY, pullReturning, refreshing, refreshComplete, scrolled, showDeepTip,
    handleTouchStart, handleTouchMove, handleTouchEnd,
  }
}
