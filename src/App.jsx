import { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import HabitButton from './components/HabitButton'
import HabitEditItem from './components/HabitEditItem'
import AddHabitModal from './components/AddHabitModal'
import LongPressModal from './components/LongPressModal'
import DayDetailModal from './components/DayDetailModal'
import HelpModal from './components/HelpModal'
import ConfirmModal from './components/ConfirmModal'
import StatsModal from './components/StatsModal'
import SettingsModal from './components/SettingsModal'
import Toast from './components/Toast'
import ArchivedHabitItem from './components/ArchivedHabitItem'
import AddToHomePrompt from './components/AddToHomePrompt'
import MonthPickerModal from './components/MonthPickerModal'
import HabitTip from './components/HabitTip'
import { getRandomTip } from './data/habitTips'
import RecordView from './components/RecordView'
import Calendar from './components/Calendar'
import StatsView from './components/StatsView'
import CategoryManageModal from './components/CategoryManageModal'
import { useHabitsStorage, loadData } from './hooks/useHabitsStorage'
import { useTheme } from './hooks/useTheme'
import { usePullToRefresh, PULL_THRESHOLD } from './hooks/usePullToRefresh'
import { useModalState } from './hooks/useModalState'
import { useHabitActions } from './hooks/useHabitActions'
import { useBackupManager } from './hooks/useBackupManager'
import { getToday, getYesterday } from './utils/date'
import { calcCurrentStreak, calcCurrentStreakWithMode } from './utils/stats'
import './App.css'

const LAST_BACKUP_KEY = 'habit-tracker-last-backup'
const ONBOARDING_KEY = 'habit-tracker-onboarding-done'
const BACKUP_DIR_NAME = 'habit-tracker-backups'
const EDIT_HINT_KEY = 'habit-tracker-edit-hint-seen'
export default function App() {
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true

  const [showWelcome, setShowWelcome] = useState(() => {
    try { return !localStorage.getItem(ONBOARDING_KEY) } catch { return false }
  })
  const [showEditHint, setShowEditHint] = useState(() => {
    try { return !localStorage.getItem(EDIT_HINT_KEY) } catch { return false }
  })
  const dismissWelcome = useCallback(() => {
    try { localStorage.setItem(ONBOARDING_KEY, '1') } catch {}
    setShowWelcome(false)
  }, [])
  const handleAddHabit = useCallback((name) => {
    dismissWelcome()
    setToast('「' + name + '」を追加しました')
  }, [dismissWelcome])
  const handleUpdateHabit = useCallback((name) => {
    setToast('「' + name + '」を更新しました')
  }, [])
  const dismissEditHint = useCallback(() => {
    try { localStorage.setItem(EDIT_HINT_KEY, '1') } catch {}
    setShowEditHint(false)
  }, [])

  const [toast, setToast] = useState(null)
  const onSaveError = useCallback((msg) => setToast(msg), [])
  const { habits, records, colorCategories, statsStartDate, streakMode, setHabits, setRecords, setColorCategories, setStatsStartDate, setStreakMode } = useHabitsStorage({ onSaveError })
  const { themeId, handleThemeSelect } = useTheme({ onSaveError })

  // 記録の中で最も古い日付（未設定時の集計開始日フォールバック）
  const oldestRecordDate = useMemo(() => {
    const dates = Object.keys(records).filter(d => (records[d] || []).length > 0).sort()
    return dates.length > 0 ? dates[0] : null
  }, [records])
  const effectiveStatsStartDate = statsStartDate ?? oldestRecordDate

  const [calendarDate, setCalendarDate] = useState(() => new Date())
  const [editMode, setEditMode] = useState(false)
  const { modal, setModal, closeModal } = useModalState()
  const mainRef = useRef(null)
  const headerRef = useRef(null)
  const stableViewportRef = useRef({ width: window.innerWidth, height: 0 })
  const stableHandlersRef = useRef(null)

  const today = getToday()
  const yesterday = getYesterday()
  const onRefresh = useCallback(() => {
    const fresh = loadData()
    setHabits(fresh.habits)
    setRecords(fresh.records)
  }, [setHabits, setRecords])

  const {
    pullY, pullReturning, refreshing, refreshComplete, scrolled,
    handleTouchStart, handleTouchMove, handleTouchEnd,
  } = usePullToRefresh({ mainRef, onRefresh })

  // 最下部 overscroll 検知による deep tip 表示
  const [showDeepTip, setShowDeepTip] = useState(false)
  const [deepTipReturning, setDeepTipReturning] = useState(false)
  const [currentTip, setCurrentTip] = useState(() => getRandomTip())
  const showDeepTipRef = useRef(false)
  const deepTipTimer = useRef(null)
  const deepTipReturnTimer = useRef(null)
  const overscrollStartY = useRef(null)

  const hideDeepTip = useCallback(() => {
    showDeepTipRef.current = false
    setShowDeepTip(false)
    setDeepTipReturning(true)
    deepTipReturnTimer.current = setTimeout(() => {
      setDeepTipReturning(false)
    }, 700)
  }, [])

  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const onTouchStart = (e) => {
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2
      overscrollStartY.current = atBottom ? e.touches[0].clientY : null
    }
    const onTouchMove = (e) => {
      if (overscrollStartY.current === null) return
      const dy = overscrollStartY.current - e.touches[0].clientY
      if (dy > 30) {
        if (!showDeepTipRef.current) setCurrentTip(getRandomTip())
        showDeepTipRef.current = true
        setShowDeepTip(true)
        setDeepTipReturning(false)
        clearTimeout(deepTipTimer.current)
        clearTimeout(deepTipReturnTimer.current)
      }
    }
    const onTouchEnd = () => {
      overscrollStartY.current = null
      deepTipTimer.current = setTimeout(() => hideDeepTip(), 2500)
    }
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      clearTimeout(deepTipTimer.current)
      clearTimeout(deepTipReturnTimer.current)
    }
  }, [mainRef, hideDeepTip])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const {
    undoAction,
    toggleHabit,
    handleUndo,
    addHabit,
    updateHabit,
    deleteHabit,
    archiveHabit,
    restoreHabit,
    handleDragEnd,
  } = useHabitActions({
    records,
    today,
    setHabits,
    setRecords,
    setModal,
    onAddHabit: dismissWelcome,
    onAddComplete: (name) => setToast(`${name} を追加しました`),
    onUpdateComplete: (name) => setToast(`${name} を更新しました`),
    onUndoComplete: () => setToast("元に戻しました"),
  })

  const {
    lastBackupDate,
    fileInputRef,
    handleExport,
    handleImportClick,
    handleFileChange,
    handleImportConfirm,
  } = useBackupManager({
    habits,
    records,
    colorCategories,
    today,
    setHabits,
    setRecords,
    setColorCategories,
    statsStartDate,
    setStatsStartDate,
    streakMode,
    setStreakMode,
    setModal,
    setToast,
    modal,
  })

  useEffect(() => {
    document.documentElement.classList.toggle('pwa-standalone', isStandalone)
    return () => document.documentElement.classList.remove('pwa-standalone')
  }, [isStandalone])

  useEffect(() => {
    const preventChromeScroll = (e) => {
      e.preventDefault()
    }
    const chromeEls = [headerRef.current].filter(Boolean)
    chromeEls.forEach(el => {
      el.addEventListener('touchmove', preventChromeScroll, { passive: false })
    })
    return () => {
      chromeEls.forEach(el => {
        el.removeEventListener('touchmove', preventChromeScroll)
      })
    }
  }, [])

  useEffect(() => {
    const scrollEl = mainRef.current
    if (!scrollEl) return undefined

    let touchStartY = 0

    const handlePanelTouchStart = (e) => {
      if (e.touches.length !== 1) return
      touchStartY = e.touches[0].clientY
      stableHandlersRef.current?.pullStart(e)
    }

    const handlePanelTouchMove = (e) => {
      if (e.touches.length !== 1) return
      // 上端で下スワイプ → pull-to-refresh のためネイティブオーバースクロールを防ぐ
      const deltaY = e.touches[0].clientY - touchStartY
      const atTop = scrollEl.scrollTop <= 0
      if (atTop && deltaY > 0) {
        e.preventDefault()
      }
      stableHandlersRef.current?.pullMove(e)
    }

    const handlePanelTouchEnd = (e) => {
      stableHandlersRef.current?.pullEnd(e)
    }

    scrollEl.addEventListener('touchstart', handlePanelTouchStart, { passive: true })
    scrollEl.addEventListener('touchmove', handlePanelTouchMove, { passive: false })
    scrollEl.addEventListener('touchend', handlePanelTouchEnd, { passive: true })
    scrollEl.addEventListener('touchcancel', handlePanelTouchEnd, { passive: true })

    return () => {
      scrollEl.removeEventListener('touchstart', handlePanelTouchStart)
      scrollEl.removeEventListener('touchmove', handlePanelTouchMove)
      scrollEl.removeEventListener('touchend', handlePanelTouchEnd)
      scrollEl.removeEventListener('touchcancel', handlePanelTouchEnd)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const setViewportHeight = () => {
      const visualViewport = window.visualViewport
      const currentWidth = Math.round(visualViewport?.width || window.innerWidth)
      const inputFocused = document.activeElement?.matches?.('input, textarea, [contenteditable="true"]')

      let height
      if (inputFocused) {
        // キーボード表示中は以前の安定値を維持してレイアウト崩れを防ぐ
        height = stableViewportRef.current.height || window.innerHeight
      } else {
        height = window.innerHeight
        stableViewportRef.current = { width: currentWidth, height }
      }

      document.documentElement.style.setProperty('--app-viewport-height', `${Math.round(height)}px`)
    }

    const refreshTimers = new Set()
    const refreshViewport = () => {
      requestAnimationFrame(setViewportHeight)
      ;[100, 300].forEach((delay) => {
        const timer = window.setTimeout(() => {
          refreshTimers.delete(timer)
          setViewportHeight()
        }, delay)
        refreshTimers.add(timer)
      })
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshViewport()
      }
    }

    refreshViewport()
    window.visualViewport?.addEventListener('resize', setViewportHeight)
    window.visualViewport?.addEventListener('scroll', setViewportHeight)
    window.addEventListener('resize', setViewportHeight)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pageshow', refreshViewport)
    window.addEventListener('focus', refreshViewport)

    return () => {
      refreshTimers.forEach((timer) => window.clearTimeout(timer))
      window.visualViewport?.removeEventListener('resize', setViewportHeight)
      window.visualViewport?.removeEventListener('scroll', setViewportHeight)
      window.removeEventListener('resize', setViewportHeight)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', refreshViewport)
      window.removeEventListener('focus', refreshViewport)
    }
  }, [])

  const handleColorCategoriesUpdate = useCallback((updated) => {
    setColorCategories(updated)
  }, [setColorCategories])

  const isEditableDate = (dateStr) => dateStr === today || dateStr === yesterday

  const activeHabits = habits.filter(h => !h.archivedAt)
  const archivedHabits = habits.filter(h => h.archivedAt)
  const todayRecords = records[today] || []

  // セクションへスクロール（ヘッダーのアイコンボタンから呼ぶ）
  const scrollToSection = useCallback((id) => {
    const main = mainRef.current
    if (!main) return
    const el = document.getElementById(`section-${id}`)
    if (!el) return
    const mainTop = main.getBoundingClientRect().top
    const elTop = el.getBoundingClientRect().top
    main.scrollBy({ top: elTop - mainTop, behavior: 'smooth' })
  }, [])


  // タイトルタップで今日の習慣へ戻る
  const scrollToTop = useCallback(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // handlers の最新版を常に参照できるよう ref で保持
  useLayoutEffect(() => {
    stableHandlersRef.current = {
      pullStart: handleTouchStart,
      pullMove: handleTouchMove,
      pullEnd: handleTouchEnd,
    }
  })

  return (
    <div
      className={`app ${isStandalone ? 'standalone' : 'browser'}${scrolled ? ' scrolled' : ''}`}
    >
      <AddToHomePrompt />
      <header
        ref={headerRef}
        className="app-header"
      >
        <button className="app-title" onClick={scrollToTop} aria-label="今日の習慣へ戻る" title="今日の習慣へ戻る">
          習慣
          {scrolled && (
            <svg className="title-home-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15" /></svg>
          )}
        </button>
        <div className="header-actions">
          {/* 実績モーダルを開く */}
          <button
            className="header-btn"
            onClick={() => setModal({ type: 'record' })}
            aria-label="実績"
            title="実績"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span className="header-btn-label" aria-hidden="true">実績</span>
          </button>
          {/* 分析モーダルを開く */}
          <button
            className="header-btn"
            onClick={() => setModal({ type: 'analysis' })}
            aria-label="分析"
            title="分析"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span className="header-btn-label" aria-hidden="true">分析</span>
          </button>
          <button
            className="header-btn"
            onClick={() => setModal({ type: 'help' })}
            aria-label="ヘルプ"
            title="ヘルプ"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className="header-btn-label" aria-hidden="true">ヘルプ</span>
          </button>
          <button
            className="header-btn"
            onClick={() => setModal({ type: 'settings' })}
            aria-label="設定"
            title="設定"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span className="header-btn-label" aria-hidden="true">設定</span>
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />
      </header>

      <div
        className={`pull-indicator${refreshing ? ' refreshing' : ''}${pullY >= PULL_THRESHOLD ? ' ready' : ''}${pullReturning ? ' returning' : ''}`}
        style={!refreshing ? { height: pullY, ...(pullY > 0 && { opacity: pullY / PULL_THRESHOLD }) } : undefined}
      >
        {(refreshing || refreshComplete) ? (
          refreshComplete ? (
            <>
              <svg className="pull-check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="pull-label">更新しました</span>
            </>
          ) : (
            <>
              <svg className="pull-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span className="pull-label">更新中...</span>
            </>
          )
        ) : (
          <>
            <svg
              className={`pull-arrow${pullY >= PULL_THRESHOLD ? ' flip' : ''}`}
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
            <span className="pull-label">
              {pullY >= PULL_THRESHOLD ? '離して更新' : '下に引っ張って更新'}
            </span>
          </>
        )}
      </div>

      <main ref={mainRef} className="app-main">
        {/* 習慣セクション（トップ） */}
        <div className="main-content">
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">今日の習慣</h2>
              {habits.length > 0 && (
                <button
                  className={`edit-toggle-btn ${editMode ? 'active' : ''}`}
                  onClick={() => setEditMode(v => !v)}
                >
                  {editMode ? '完了' : '編集'}
                </button>
              )}
            </div>

            {activeHabits.length > 0 && !editMode && !showWelcome && showEditHint && (
              <div className="edit-hint">
                <span>習慣を長押しすると今日・昨日の記録をまとめて変更できます。</span>
                <button type="button" onClick={dismissEditHint}>閉じる</button>
              </div>
            )}

            {habits.length === 0 ? (
              <div className="empty-state">
                {showWelcome ? (
                  <div className="welcome-card">
                    <p className="welcome-title">ようこそ！</p>
                    <p className="welcome-body">続けたい習慣をひとつ追加してみましょう。</p>
                  </div>
                ) : (
                  <p className="empty-text">習慣を追加してみよう</p>
                )}
                <button className="add-first-btn" onClick={() => setModal({ type: 'add' })}>
                  + 最初の習慣を追加
                </button>
                {showWelcome ? (
                  <button className="help-link-btn" onClick={dismissWelcome}>スキップ</button>
                ) : (
                  <button className="help-link-btn" onClick={() => setModal({ type: 'help' })}>
                    使い方を見る
                  </button>
                )}
              </div>
            ) : editMode ? (
              <>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={activeHabits.map(h => h.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="habits-edit-list">
                      {activeHabits.map(habit => (
                        <HabitEditItem
                          key={habit.id}
                          habit={habit}
                          onEdit={(h) => setModal({ type: 'edit', habit: h })}
                          onArchive={(h) => setModal({ type: 'archiveConfirm', habitId: h.id, habitName: h.name })}
                          onDelete={(h) => setModal({ type: 'deleteConfirm', habitId: h.id, habitName: h.name })}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                <p className="edit-mode-hint">⠿ をドラッグして並び替え</p>
                <button
                  className="add-in-edit-btn"
                  onClick={() => { setEditMode(false); setModal({ type: 'add' }) }}
                >
                  ＋ 習慣を追加
                </button>
                {archivedHabits.length > 0 && (
                  <div className="archived-section">
                    <p className="section-title">終了した習慣</p>
                    {archivedHabits.map(habit => (
                      <ArchivedHabitItem
                        key={habit.id}
                        habit={habit}
                        onRestore={(h) => restoreHabit(h.id)}
                        onDelete={(h) => setModal({ type: 'deleteConfirm', habitId: h.id, habitName: h.name })}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="habits-grid">
                  {activeHabits.map(habit => (
                    <HabitButton
                      key={habit.id}
                      habit={habit}
                      completed={todayRecords.includes(habit.id)}
                      streak={calcCurrentStreakWithMode(habit.id, records, 'accumulate')}
                      onPress={(h) => toggleHabit(h.id, today)}
                      onLongPress={(h) => { dismissEditHint(); setModal({ type: 'longPress', habit: h }) }}
                    />
                  ))}
                </div>
                <button className="add-habit-btn" onClick={() => setModal({ type: 'add' })}>
                  <span className="add-icon">＋</span>
                  <span>習慣を追加</span>
                </button>
              </>
            )}
          </section>
          {/* カレンダー（ホーム主役） */}
          <section id="section-record" className="section">
            <Calendar
              date={calendarDate}
              onDateChange={setCalendarDate}
              habits={habits}
              records={records}
              today={today}
              onDayClick={(dateStr) => setModal({ type: 'day', dateStr })}
              onMonthTitleClick={() => setModal({ type: 'monthPicker' })}
            />
          </section>
          <HabitTip tip={currentTip} visible={showDeepTip} returning={deepTipReturning} />
        </div>
      </main>

      {modal?.type === 'record' && (
        <RecordView
          calendarDate={calendarDate}
          onCalendarDateChange={setCalendarDate}
          habits={habits}
          records={records}
          today={today}
          onDayClick={(dateStr) => setModal({ type: 'day', dateStr })}
          onMonthTitleClick={() => setModal({ type: 'monthPicker' })}
          asModal
          onClose={closeModal}
        />
      )}

      {modal?.type === 'analysis' && (
        <StatsView
          habits={habits}
          records={records}
          today={today}
          colorCategories={colorCategories}
          statsStartDate={effectiveStatsStartDate}
          asModal
          onClose={closeModal}
        />
      )}

      {modal?.type === 'monthPicker' && (
        <MonthPickerModal
          currentDate={calendarDate}
          records={records}
          onSelect={(year, month) => setCalendarDate(new Date(year, month, 1))}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'add' && (
        <AddHabitModal onSave={addHabit} onClose={closeModal} colorCategories={colorCategories} />
      )}

      {modal?.type === 'edit' && (
        <AddHabitModal
          initialHabit={modal.habit}
          onSave={({ name, color }) => updateHabit({ name, color, habitId: modal.habit.id })}
          onClose={closeModal}
          colorCategories={colorCategories}
        />
      )}

      {modal?.type === 'longPress' && (
        <LongPressModal
          habit={modal.habit}
          today={today}
          yesterday={yesterday}
          isCompletedToday={todayRecords.includes(modal.habit.id)}
          isCompletedYesterday={(records[yesterday] || []).includes(modal.habit.id)}
          onSelect={(dateStr) => { toggleHabit(modal.habit.id, dateStr); closeModal() }}
          onEdit={(h) => setModal({ type: 'edit', habit: h })}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'stats' && (
        <StatsModal habits={habits} records={records} onClose={closeModal} />
      )}

      {modal?.type === 'help' && (
        <HelpModal onClose={closeModal} />
      )}

      {modal?.type === 'exportConfirm' && (
        <ConfirmModal
          title="バックアップ保存"
          message={'showDirectoryPicker' in window
            ? `バックアップファイルを保存します。\n\n保存先フォルダを選択すると「${BACKUP_DIR_NAME}」フォルダを作って自動保存します。\nキャンセルした場合はバックアップされません。`
            : 'バックアップファイルをダウンロードします。\n\nダウンロード後、「ファイルに保存」を選択してください。\nキャンセルした場合はバックアップされません。'}
          confirmLabel="保存する"
          danger={false}
          onConfirm={() => { handleExport(); closeModal() }}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'importConfirm' && (
        <ConfirmModal
          title="バックアップから復元"
          message={`バックアップファイルを選択してください。\n\n⚠ 現在のデータはすべて上書きされます。\nこの操作は取り消せません。`}
          confirmLabel="ファイルを選択"
          danger={true}
          onConfirm={() => { closeModal(); handleImportClick() }}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'importFile' && (() => {
        const recordDates = Object.keys(modal.data.records).sort()
        const hasColorCategories = modal.data.colorCategories && Object.keys(modal.data.colorCategories).length > 0
        const colorText = hasColorCategories ? '\n色の名前: あり（復元されます）' : '\n色の名前: なし（現在の設定は変わりません）'
        const skippedText = modal.skippedUnknownRecords > 0
          ? `\n\n※ バックアップ内に存在しない習慣IDの記録 ${modal.skippedUnknownRecords}件は除外して復元します。`
          : ''
        const rangeText = recordDates.length > 0
          ? `${recordDates[0]} 〜 ${recordDates[recordDates.length - 1]}`
          : 'なし'
        return (
          <ConfirmModal
            title="インポートの確認"
            message={`「${modal.filename}」をインポートします。\n\n習慣: ${modal.data.habits.length}件\n記録日数: ${recordDates.length}日\n期間: ${rangeText}${colorText}${skippedText}\n\n⚠ 現在のデータはすべて上書きされます。\nこの操作は取り消せません。`}
            confirmLabel="インポート"
            danger={true}
            onConfirm={handleImportConfirm}
            onClose={closeModal}
          />
        )
      })()}

      {modal?.type === 'importError' && (
        <ConfirmModal
          title="読み込みエラー"
          message={modal.message}
          confirmLabel="OK"
          showCancel={false}
          onConfirm={closeModal}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'settings' && (
        <SettingsModal
          currentThemeId={themeId}
          onSelectTheme={(theme) => { handleThemeSelect(theme) }}
          onExport={() => { closeModal(); setTimeout(() => setModal({ type: 'exportConfirm' }), 50) }}
          onImport={() => { closeModal(); setTimeout(() => setModal({ type: 'importConfirm' }), 50) }}
          onManageCategories={() => { closeModal(); setTimeout(() => setModal({ type: 'categoryManage' }), 50) }}
          colorCategories={colorCategories}
          onClose={closeModal}
          lastBackupDate={lastBackupDate}
          statsStartDate={statsStartDate}
          autoStatsStartDate={oldestRecordDate}
          onStatsStartDateChange={setStatsStartDate}
        />
      )}

      {modal?.type === 'categoryManage' && (
        <CategoryManageModal
          colorCategories={colorCategories}
          onUpdate={handleColorCategoriesUpdate}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'archiveConfirm' && (
        <ConfirmModal
          title="習慣を終了"
          message={`「${modal.habitName}」を終了しますか？\n\n✓ 過去の記録は残ります\n✓ いつでも再開できます`}
          confirmLabel="終了する"
          danger={false}
          onConfirm={() => archiveHabit(modal.habitId)}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'deleteConfirm' && (
        <ConfirmModal
          title="習慣を完全に削除"
          message={`「${modal.habitName}」を完全に削除しますか？\n\n⚠ 過去の記録もすべて消えます\n✗ この操作は取り消せません`}
          confirmLabel="完全に削除"
          onConfirm={() => deleteHabit(modal.habitId)}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'day' && (
        <DayDetailModal
          dateStr={modal.dateStr}
          habits={habits}
          completedIds={records[modal.dateStr] || []}
          isEditable={isEditableDate(modal.dateStr)}
          onToggle={(habitId) => toggleHabit(habitId, modal.dateStr)}
          onClose={closeModal}
        />
      )}

      {undoAction && (
        <Toast
          message="達成を取り消しました"
          action="元に戻す"
          onAction={handleUndo}
          onDismiss={() => {}}
        />
      )}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

    </div>
  )
}

