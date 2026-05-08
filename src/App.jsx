import { useState, useEffect, useCallback, useRef } from 'react'
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
  arrayMove,
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
import RecordView from './components/RecordView'
import StatsView from './components/StatsView'
import { useHabitsStorage, loadData } from './hooks/useHabitsStorage'
import { useTheme } from './hooks/useTheme'
import { usePullToRefresh, PULL_THRESHOLD } from './hooks/usePullToRefresh'
import { getToday, getYesterday } from './utils/date'
import { calcCurrentStreak } from './utils/stats'
import { sanitizeImportData, validateImportData } from './utils/validation'
import './App.css'

const LAST_BACKUP_KEY = 'habit-tracker-last-backup'
const ONBOARDING_KEY = 'habit-tracker-onboarding-done'
const TAB_ORDER = ['record', 'habit', 'stats']
const SWIPE_THRESHOLD_X = 72
const SWIPE_MAX_Y = 60
const BACKUP_DIR_NAME = 'habit-tracker-backups'

export default function App() {
  const viewportDebug = new URLSearchParams(window.location.search).has('debugViewport')
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true

  const [showWelcome, setShowWelcome] = useState(() => {
    try { return !localStorage.getItem(ONBOARDING_KEY) } catch { return false }
  })
  const dismissWelcome = useCallback(() => {
    try { localStorage.setItem(ONBOARDING_KEY, '1') } catch {}
    setShowWelcome(false)
  }, [])

  const { habits, records, setHabits, setRecords } = useHabitsStorage()
  const { themeId, handleThemeSelect } = useTheme()

  const [calendarDate, setCalendarDate] = useState(() => new Date())
  const [editMode, setEditMode] = useState(false)
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [lastBackupDate, setLastBackupDate] = useState(() => {
    try { return localStorage.getItem(LAST_BACKUP_KEY) || null } catch { return null }
  })
  const [activeTab, setActiveTab] = useState('habit')
  const [tabDragX, setTabDragX] = useState(0)
  const [tabSettling, setTabSettling] = useState(false)
  const [viewportDebugInfo, setViewportDebugInfo] = useState('')
  const [undoAction, setUndoAction] = useState(null)
  const undoTimerRef = useRef(null)
  const mainRef = useRef(null)
  const headerRef = useRef(null)
  const footerRef = useRef(null)
  const fileInputRef = useRef(null)
  const stableViewportRef = useRef({ width: window.innerWidth, height: 0 })
  const tabSwipeRef = useRef(null)

  const today = getToday()
  const yesterday = getYesterday()
  const screenTitle = activeTab === 'record'
    ? '実績'
    : activeTab === 'stats'
      ? '分析'
      : '習慣'

  const onRefresh = useCallback(() => {
    const fresh = loadData()
    setHabits(fresh.habits)
    setRecords(fresh.records)
  }, [setHabits, setRecords])

  const {
    pullY, pullReturning, refreshing, refreshComplete, scrolled,
    handleTouchStart, handleTouchMove, handleTouchEnd,
  } = usePullToRefresh({ mainRef, onRefresh })
  const tabsLocked = refreshing && !refreshComplete

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  useEffect(() => {
    document.documentElement.classList.toggle('pwa-standalone', isStandalone)
    return () => document.documentElement.classList.remove('pwa-standalone')
  }, [isStandalone])

  useEffect(() => {
    const preventChromeScroll = (e) => {
      e.preventDefault()
    }
    const chromeEls = [headerRef.current, footerRef.current].filter(Boolean)
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

    const handleMainTouchStart = (e) => {
      if (e.touches.length !== 1) return
      touchStartY = e.touches[0].clientY
    }

    const handleMainTouchMove = (e) => {
      if (e.touches.length !== 1) return

      const deltaY = e.touches[0].clientY - touchStartY
      const atTop = scrollEl.scrollTop <= 0
      const atBottom =
        scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 1

      if ((atTop && deltaY > 0) || (atBottom && deltaY < 0)) {
        e.preventDefault()
      }
    }

    scrollEl.addEventListener('touchstart', handleMainTouchStart, { passive: true })
    scrollEl.addEventListener('touchmove', handleMainTouchMove, { passive: false })

    return () => {
      scrollEl.removeEventListener('touchstart', handleMainTouchStart)
      scrollEl.removeEventListener('touchmove', handleMainTouchMove)
    }
  }, [])

  useEffect(() => {
    const setViewportHeight = () => {
      const visualViewport = window.visualViewport
      const currentWidth = Math.round(visualViewport?.width || window.innerWidth)
      const currentHeight = visualViewport?.height || window.innerHeight
      const activeElement = document.activeElement
      const inputFocused = activeElement?.matches?.('input, textarea, [contenteditable="true"]')

      if (Math.abs(currentWidth - stableViewportRef.current.width) > 40) {
        stableViewportRef.current = { width: currentWidth, height: 0 }
      }

      const height = inputFocused
        ? currentHeight
        : Math.max(stableViewportRef.current.height, currentHeight)

      stableViewportRef.current = { width: currentWidth, height }
      document.documentElement.style.setProperty('--app-viewport-height', `${height}px`)
      if (viewportDebug) {
        const appHeight = document.querySelector('.app')?.getBoundingClientRect().height
        const styles = getComputedStyle(document.documentElement)
        const screenHeight = styles.getPropertyValue('--app-screen-height').trim()
        setViewportDebugInfo(
          `vv:${Math.round(currentHeight)} stable:${Math.round(height)} ih:${window.innerHeight} app:${Math.round(appHeight || 0)} shell:${screenHeight}`
        )
      }
    }

    document.documentElement.classList.toggle('viewport-debug-enabled', viewportDebug)
    setViewportHeight()
    window.visualViewport?.addEventListener('resize', setViewportHeight)
    window.visualViewport?.addEventListener('scroll', setViewportHeight)
    window.addEventListener('resize', setViewportHeight)

    return () => {
      document.documentElement.classList.remove('viewport-debug-enabled')
      window.visualViewport?.removeEventListener('resize', setViewportHeight)
      window.visualViewport?.removeEventListener('scroll', setViewportHeight)
      window.removeEventListener('resize', setViewportHeight)
    }
  }, [viewportDebug])

  const closeModal = useCallback(() => setModal(null), [])

  const handleTabSelect = useCallback((tab) => {
    if (tabsLocked || tab === activeTab) return
    setTabSettling(true)
    setTabDragX(0)
    setActiveTab(tab)
  }, [activeTab, tabsLocked])

  const handleTabSwipeStart = useCallback((e) => {
    if (
      modal ||
      editMode ||
      tabsLocked ||
      e.touches.length !== 1 ||
      e.target.closest('button, a, input, textarea, select, [contenteditable], [role="button"], .app-header, .app-footer, .modal-backdrop')
    ) {
      tabSwipeRef.current = null
      return
    }

    const touch = e.touches[0]
    const activeIndex = TAB_ORDER.indexOf(activeTab)
    tabSwipeRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      horizontal: false,
      activeIndex,
    }
  }, [activeTab, editMode, modal, tabsLocked])

  const handleTabSwipeMove = useCallback((e) => {
    const swipe = tabSwipeRef.current
    if (!swipe || e.touches.length !== 1) return false

    const touch = e.touches[0]
    const dx = touch.clientX - swipe.x
    const dy = touch.clientY - swipe.y

    if (!swipe.horizontal && Math.abs(dx) > 18 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      swipe.horizontal = true
    }

    if (swipe.horizontal) {
      e.preventDefault()
      const atFirst = swipe.activeIndex === 0 && dx > 0
      const atLast = swipe.activeIndex === TAB_ORDER.length - 1 && dx < 0
      setTabSettling(false)
      setTabDragX((atFirst || atLast) ? dx * 0.28 : dx)
      return true
    }

    if (Math.abs(dy) > 18 && Math.abs(dy) > Math.abs(dx)) {
      tabSwipeRef.current = null
    }

    return false
  }, [])

  const handleTabSwipeEnd = useCallback((e) => {
    const swipe = tabSwipeRef.current
    tabSwipeRef.current = null
    if (!swipe?.horizontal || tabsLocked) {
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
    const nextTab = TAB_ORDER[nextIndex]
    if (nextTab) setActiveTab(nextTab)
  }, [tabsLocked])

  const toggleHabit = useCallback((habitId, dateStr) => {
    const wasOn = (records[dateStr] || []).includes(habitId)
    setRecords(prev => {
      const dr = prev[dateStr] || []
      const on = dr.includes(habitId)
      return {
        ...prev,
        [dateStr]: on ? dr.filter(id => id !== habitId) : [...dr, habitId],
      }
    })
    clearTimeout(undoTimerRef.current)
    if (wasOn) {
      setUndoAction({ habitId, dateStr })
      undoTimerRef.current = setTimeout(() => setUndoAction(null), 4000)
    } else {
      setUndoAction(null)
    }
  }, [records])

  const handleUndo = useCallback(() => {
    if (!undoAction) return
    clearTimeout(undoTimerRef.current)
    const { habitId, dateStr } = undoAction
    setRecords(prev => {
      const dr = prev[dateStr] || []
      if (dr.includes(habitId)) return prev
      return { ...prev, [dateStr]: [...dr, habitId] }
    })
    setUndoAction(null)
  }, [undoAction])

  const addHabit = useCallback(({ name, color }) => {
    const id = `h_${Date.now()}`
    setHabits(prev => [...prev, { id, name, color, createdAt: today }])
    setModal(null)
    dismissWelcome()
  }, [today, dismissWelcome])

  const updateHabit = useCallback(({ name, color }) => {
    setHabits(prev =>
      prev.map(h => h.id === modal.habit.id ? { ...h, name, color } : h)
    )
    setModal(null)
  }, [modal])

  const deleteHabit = useCallback((habitId) => {
    setHabits(prev => prev.filter(h => h.id !== habitId))
    setRecords(prev => {
      const next = {}
      for (const [date, ids] of Object.entries(prev)) {
        const filtered = ids.filter(id => id !== habitId)
        if (filtered.length > 0) next[date] = filtered
      }
      return next
    })
    setModal(null)
  }, [])

  const archiveHabit = useCallback((habitId) => {
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, archivedAt: today } : h))
    setModal(null)
  }, [today])

  const restoreHabit = useCallback((habitId) => {
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, archivedAt: null } : h))
    setModal(null)
  }, [])

  const handleDragEnd = useCallback(({ active, over }) => {
    if (over && active.id !== over.id) {
      setHabits(prev => {
        const oldIndex = prev.findIndex(h => h.id === active.id)
        const newIndex = prev.findIndex(h => h.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }, [])

  const isEditableDate = (dateStr) => dateStr === today || dateStr === yesterday

  const activeHabits = habits.filter(h => !h.archivedAt)
  const archivedHabits = habits.filter(h => h.archivedAt)
  const todayRecords = records[today] || []

  // --- Export / Import ---
  const handleExport = useCallback(async () => {
    const sanitized = sanitizeImportData({ habits, records })
    const json = JSON.stringify(sanitized.data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const filename = `habit-tracker-${today}.json`
    const skippedText = sanitized.skippedUnknownRecords > 0
      ? `（不明な記録 ${sanitized.skippedUnknownRecords}件を除外）`
      : ''

    const markSaved = () => {
      try { localStorage.setItem(LAST_BACKUP_KEY, today) } catch {}
      setLastBackupDate(today)
    }

    if ('showDirectoryPicker' in window) {
      try {
        const rootDir = await window.showDirectoryPicker({ mode: 'readwrite' })
        const backupDir = await rootDir.getDirectoryHandle(BACKUP_DIR_NAME, { create: true })
        const fileHandle = await backupDir.getFileHandle(filename, { create: true })
        const writable = await fileHandle.createWritable()
        await writable.write(blob)
        await writable.close()
        markSaved()
        setToast(`${BACKUP_DIR_NAME}/${filename} に保存しました${skippedText}`)
        return
      } catch (error) {
        if (error?.name === 'AbortError') {
          setToast('バックアップ保存をキャンセルしました')
          return
        }
        console.warn('Directory backup failed, falling back to download', error)
      }
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    setToast(`${filename} のダウンロードを開始しました。保存されたかどうかはブラウザで確認してください${skippedText}`)
  }, [habits, records, today])

  const handleImportClick = () => fileInputRef.current?.click()

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const MAX_FILE_SIZE = 2 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      setModal({ type: 'importError', message: 'ファイルサイズが大きすぎます（上限 2MB）。\nバックアップファイルを確認してください。' })
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        const error = validateImportData(data)
        if (error) {
          setModal({ type: 'importError', message: error })
        } else {
          const sanitized = sanitizeImportData(data)
          setModal({
            type: 'importFile',
            data: sanitized.data,
            filename: file.name,
            skippedUnknownRecords: sanitized.skippedUnknownRecords,
          })
        }
      } catch {
        setModal({ type: 'importError', message: 'JSONの解析に失敗しました。\nファイルが壊れているか、形式が正しくありません。' })
      }
      e.target.value = ''
    }
    reader.readAsText(file)
  }, [])

  const handleImportConfirm = useCallback(() => {
    const habitCount = modal.data.habits.length
    const dayCount = Object.keys(modal.data.records).length
    setHabits(modal.data.habits)
    setRecords(modal.data.records)
    setModal(null)
    setToast(`データを復元しました（習慣 ${habitCount}件・記録 ${dayCount}日分）`)
  }, [modal])

  const handleChromeTouchStart = useCallback((e) => {
    e.stopPropagation()
  }, [])

  const handleChromeTouchMove = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleAppTouchStart = useCallback((e) => {
    handleTabSwipeStart(e)
    handleTouchStart(e)
  }, [handleTabSwipeStart, handleTouchStart])

  const handleAppTouchMove = useCallback((e) => {
    const swipingTabs = handleTabSwipeMove(e)
    if (!swipingTabs) handleTouchMove(e)
  }, [handleTabSwipeMove, handleTouchMove])

  const handleAppTouchEnd = useCallback((e) => {
    handleTabSwipeEnd(e)
    handleTouchEnd(e)
  }, [handleTabSwipeEnd, handleTouchEnd])

  const activeTabIndex = TAB_ORDER.indexOf(activeTab)
  const tabTrackStyle = {
    width: `${TAB_ORDER.length * 100}%`,
    transform: `translateX(calc(${-activeTabIndex * (100 / TAB_ORDER.length)}% + ${tabDragX}px))`,
  }

  return (
    <div
      className={`app ${isStandalone ? 'standalone' : 'browser'}${scrolled ? ' scrolled' : ''}`}
      onTouchStart={handleAppTouchStart}
      onTouchMove={handleAppTouchMove}
      onTouchEnd={handleAppTouchEnd}
      onTouchCancel={handleAppTouchEnd}
    >
      <AddToHomePrompt />
      <header
        ref={headerRef}
        className="app-header"
        onTouchStart={handleChromeTouchStart}
        onTouchMove={handleChromeTouchMove}
      >
        <h1 className="app-title">{screenTitle}</h1>
        <div className="header-actions">
          <button
            className="header-btn"
            onClick={() => setModal({ type: 'help' })}
            aria-label="ヘルプ"
            title="ヘルプ"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
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
        <div className="tab-viewport">
          <div
            className={`tab-track${tabSettling ? ' settling' : ''}`}
            style={tabTrackStyle}
            onTransitionEnd={() => setTabSettling(false)}
          >
            <div className="tab-panel" aria-hidden={activeTab !== 'record'}>
              <RecordView
                calendarDate={calendarDate}
                onCalendarDateChange={setCalendarDate}
                habits={habits}
                records={records}
                today={today}
                onDayClick={(dateStr) => setModal({ type: 'day', dateStr })}
                onMonthTitleClick={() => setModal({ type: 'monthPicker' })}
              />
            </div>

            <div className="tab-panel" aria-hidden={activeTab !== 'habit'}>
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

            {habits.length === 0 ? (
              <div className="empty-state">
                {showWelcome ? (
                  <div className="welcome-card">
                    <p className="welcome-title">ようこそ！</p>
                    <p className="welcome-body">まず最初の習慣を1つ追加してみましょう。毎日の記録がここに並びます。</p>
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
                    <p className="archived-section-title">終了した習慣</p>
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
              <div className="habits-grid">
                {activeHabits.map(habit => (
                  <HabitButton
                    key={habit.id}
                    habit={habit}
                    completed={todayRecords.includes(habit.id)}
                    streak={calcCurrentStreak(habit.id, records)}
                    onPress={(h) => toggleHabit(h.id, today)}
                    onLongPress={(h) => setModal({ type: 'longPress', habit: h })}
                    onEdit={(h) => setModal({ type: 'edit', habit: h })}
                  />
                ))}
                <button className="add-habit-btn" onClick={() => setModal({ type: 'add' })}>
                  <span className="add-icon">＋</span>
                  <span>追加</span>
                </button>
              </div>
            )}
          </section>
            </div>

            <div className="tab-panel" aria-hidden={activeTab !== 'stats'}>
              <section className="section">
                <div className="section-header">
                  <h2 className="section-title">これからの続け方</h2>
                </div>
                <StatsView habits={habits} records={records} today={today} />
              </section>
            </div>
          </div>
        </div>
      </main>

      {modal?.type === 'monthPicker' && (
        <MonthPickerModal
          currentDate={calendarDate}
          records={records}
          onSelect={(year, month) => setCalendarDate(new Date(year, month, 1))}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'add' && (
        <AddHabitModal onSave={addHabit} onClose={closeModal} />
      )}

      {modal?.type === 'edit' && (
        <AddHabitModal
          initialHabit={modal.habit}
          onSave={updateHabit}
          onClose={closeModal}
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
          message={`バックアップファイルを保存します。\n\n対応しているブラウザでは、選んだ場所に「${BACKUP_DIR_NAME}」フォルダを作って保存します。`}
          confirmLabel="ダウンロード"
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
        const skippedText = modal.skippedUnknownRecords > 0
          ? `\n\n※ バックアップ内に存在しない習慣IDの記録 ${modal.skippedUnknownRecords}件は除外して復元します。`
          : ''
        const rangeText = recordDates.length > 0
          ? `${recordDates[0]} 〜 ${recordDates[recordDates.length - 1]}`
          : 'なし'
        return (
          <ConfirmModal
            title="インポートの確認"
            message={`「${modal.filename}」をインポートします。\n\n習慣: ${modal.data.habits.length}件\n記録日数: ${recordDates.length}日\n期間: ${rangeText}${skippedText}\n\n⚠ 現在のデータはすべて上書きされます。\nこの操作は取り消せません。`}
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
          onClose={closeModal}
          lastBackupDate={lastBackupDate}
        />
      )}

      {modal?.type === 'archiveConfirm' && (
        <ConfirmModal
          title="習慣を終了"
          message={`「${modal.habitName}」を終了しますか？\n\n過去の記録は保持されます。\nいつでも再開できます。`}
          confirmLabel="終了する"
          danger={false}
          onConfirm={() => archiveHabit(modal.habitId)}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'deleteConfirm' && (
        <ConfirmModal
          title="習慣を完全に削除"
          message={`「${modal.habitName}」を完全に削除しますか？\n\n⚠ 過去の記録もすべて削除されます。\nこの操作は取り消せません。`}
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
        <div className="undo-toast">
          <span className="undo-message">達成を取り消しました</span>
          <button className="undo-btn" onClick={handleUndo}>元に戻す</button>
        </div>
      )}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      <footer
        ref={footerRef}
        className="app-footer"
        onTouchStart={handleChromeTouchStart}
        onTouchMove={handleChromeTouchMove}
      >
        <div className="app-footer-inner">
          <button
            className={`footer-btn${activeTab === 'record' ? ' active' : ''}`}
            onClick={() => handleTabSelect('record')}
            disabled={tabsLocked}
            aria-disabled={tabsLocked}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>実績</span>
          </button>
          <button
            className={`footer-btn main${activeTab === 'habit' ? ' active' : ''}`}
            onClick={() => handleTabSelect('habit')}
            disabled={tabsLocked}
            aria-disabled={tabsLocked}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>習慣</span>
          </button>
          <button
            className={`footer-btn${activeTab === 'stats' ? ' active' : ''}`}
            onClick={() => handleTabSelect('stats')}
            disabled={tabsLocked}
            aria-disabled={tabsLocked}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span>分析</span>
          </button>
        </div>
      </footer>

      {viewportDebug && (
        <>
          <div className="viewport-debug-shell-bar" />
          <div className="viewport-debug-fixed-bar" />
          <div className="viewport-debug-panel">{viewportDebugInfo}</div>
        </>
      )}
    </div>
  )
}
