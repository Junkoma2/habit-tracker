import { useState, useRef, useCallback, useEffect } from 'react'

export const PULL_THRESHOLD = 80

export function usePullToRefresh({ mainRef, onRefresh }) {
  const [pullY, setPullY] = useState(0)
  const [pullReturning, setPullReturning] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshComplete, setRefreshComplete] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const pullStartY = useRef(null)
  const justScrolledToTop = useRef(false)
  const scrollStopTimer = useRef(null)

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
  }, [mainRef])

  const handleTouchStart = useCallback((e) => {
    // ヘッダー上のタッチはpull-to-refreshを起動しない
    if (e.target.closest('.app-header')) return
    // スクロール戻り直後はpull-to-refreshを許可しない
    if ((mainRef.current?.scrollTop ?? 0) === 0 && !justScrolledToTop.current) {
      pullStartY.current = e.touches[0].clientY
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
    } else {
      pullStartY.current = null
      setPullY(0)
    }
  }, [])

  const handleTouchEnd = useCallback(async () => {
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
              const finish = (val) => { if (!done) { done = true; resolve(val) } }

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
  }, [pullY, onRefresh])

  return {
    pullY, pullReturning, refreshing, refreshComplete, scrolled,
    handleTouchStart, handleTouchMove, handleTouchEnd,
  }
}
