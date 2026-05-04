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
import Calendar from './components/Calendar'
import HabitButton from './components/HabitButton'
import HabitEditItem from './components/HabitEditItem'
import AddHabitModal from './components/AddHabitModal'
import LongPressModal from './components/LongPressModal'
import DayDetailModal from './components/DayDetailModal'
import HelpModal from './components/HelpModal'
import ConfirmModal from './components/ConfirmModal'
import StatsModal from './components/StatsModal'
import SettingsModal, { THEMES, applyTheme } from './components/SettingsModal'
import Toast from './components/Toast'
import { getToday, getYesterday } from './utils/date'
import { calcCurrentStreak } from './utils/stats'
import { validateImportData } from './utils/validation'
import './App.css'

const STORAGE_KEY = 'habit-tracker-v1'
const THEME_STORAGE_KEY = 'habit-tracker-theme'
const LAST_BACKUP_KEY = 'habit-tracker-last-backup'

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (
        data && typeof data === 'object' && !Array.isArray(data) &&
        Array.isArray(data.habits) &&
        data.records && typeof data.records === 'object' && !Array.isArray(data.records)
      ) {
        return data
      }
    }
  } catch {}
  return { habits: [], records: {} }
}

const _initial = loadData()

function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved) return THEMES.find(t => t.id === saved) ?? THEMES[0]
  } catch {}
  return THEMES[0]
}

export default function App() {
  const [habits, setHabits] = useState(_initial.habits)
  const [records, setRecords] = useState(_initial.records)
  const [themeId, setThemeId] = useState(() => { const t = loadTheme(); applyTheme(t); return t.id })
  const [calendarDate, setCalendarDate] = useState(() => new Date())
  const [editMode, setEditMode] = useState(false)
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [lastBackupDate, setLastBackupDate] = useState(() => {
    try { return localStorage.getItem(LAST_BACKUP_KEY) || null } catch { return null }
  })
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pullStartY = useRef(null)
  const justScrolledToTop = useRef(false)
  const scrollStopTimer = useRef(null)
  const mainRef = useRef(null)
  const PULL_THRESHOLD = 80

  const today = getToday()
  const yesterday = getYesterday()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ habits, records }))
  }, [habits, records])

  useEffect(() => {
    const setViewportHeight = () => {
      const height = window.visualViewport?.height || window.innerHeight
      document.documentElement.style.setProperty('--app-viewport-height', `${height}px`)
    }

    setViewportHeight()
    window.visualViewport?.addEventListener('resize', setViewportHeight)
    window.visualViewport?.addEventListener('scroll', setViewportHeight)
    window.addEventListener('resize', setViewportHeight)

    return () => {
      window.visualViewport?.removeEventListener('resize', setViewportHeight)
      window.visualViewport?.removeEventListener('scroll', setViewportHeight)
      window.removeEventListener('resize', setViewportHeight)
    }
  }, [])

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
        setMenuOpen(false)
        scrollStopTimer.current = setTimeout(() => {
          justScrolledToTop.current = false
        }, 300)
      }
    }
    scrollEl.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => scrollEl.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const handler = () => setMenuOpen(false)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [menuOpen])

  const closeModal = useCallback(() => setModal(null), [])

  const toggleHabit = useCallback((habitId, dateStr) => {
    setRecords(prev => {
      const dayRecords = prev[dateStr] || []
      const isOn = dayRecords.includes(habitId)
      return {
        ...prev,
        [dateStr]: isOn
          ? dayRecords.filter(id => id !== habitId)
          : [...dayRecords, habitId],
      }
    })
  }, [])

  const addHabit = useCallback(({ name, color }) => {
    const id = `h_${Date.now()}`
    setHabits(prev => [...prev, { id, name, color, createdAt: today }])
    setModal(null)
  }, [today])

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

  const todayRecords = records[today] || []

  // --- Export / Import ---
  const fileInputRef = useRef(null)

  const handleExport = useCallback(() => {
    const json = JSON.stringify({ habits, records }, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `habit-tracker-${today}.json`
    a.click()
    URL.revokeObjectURL(url)
    try { localStorage.setItem(LAST_BACKUP_KEY, today) } catch {}
    setLastBackupDate(today)
    setToast(`habit-tracker-${today}.json を保存しました`)
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
          setModal({ type: 'importFile', data, filename: file.name })
        }
      } catch {
        setModal({ type: 'importError', message: 'JSONの解析に失敗しました。\nファイルが壊れているか、形式が正しくありません。' })
      }
      e.target.value = ''
    }
    reader.readAsText(file)
  }, [])

  const handleThemeSelect = useCallback((theme) => {
    applyTheme(theme)
    setThemeId(theme.id)
    localStorage.setItem(THEME_STORAGE_KEY, theme.id)
  }, [])

  const handleImportConfirm = useCallback(() => {
    const habitCount = modal.data.habits.length
    const dayCount = Object.keys(modal.data.records).length
    setHabits(modal.data.habits)
    setRecords(modal.data.records)
    setModal(null)
    setToast(`データを復元しました（習慣 ${habitCount}件・記録 ${dayCount}日分）`)
  }, [modal])

  const handleTouchStart = useCallback((e) => {
    // スクロール戻り直後はpull-to-refreshを許可しない
    if ((mainRef.current?.scrollTop ?? 0) === 0 && !justScrolledToTop.current) {
      pullStartY.current = e.touches[0].clientY
    }
  }, [])

  const handleTouchMove = useCallback((e) => {
    const currentY = e.touches[0].clientY

    // pull-to-refresh
    if (pullStartY.current === null) return
    const dy = currentY - pullStartY.current
    if (dy > 0) {
      setPullY(Math.min(dy * 0.4, PULL_THRESHOLD + 16))
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

      const fresh = loadData()
      setHabits(fresh.habits)
      setRecords(fresh.records)
      setTimeout(() => {
        setRefreshing(false)
        if (swUpdated) window.location.reload()
      }, 700)
    } else {
      setPullY(0)
    }
    pullStartY.current = null
  }, [pullY])

  return (
    <div
      className={`app${scrolled ? ' scrolled' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <header className="app-header">
        <h1 className="app-title">習慣トラッカー</h1>
        <div className="header-actions">
          <button className="header-btn" onClick={() => setModal({ type: 'help' })}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>ヘルプ</span>
          </button>
          <button className="header-btn" onClick={() => setModal({ type: 'settings' })}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>設定</span>
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />

        <div className="hamburger-wrapper">
          <button className="hamburger-btn" onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v) }} aria-label="メニュー">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          {menuOpen && (
            <>
              <div className="header-menu">
                {[
                  { type: 'help', label: 'ヘルプ', icon: <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></> },
                  { type: 'settings', label: '設定', icon: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></> },
                ].map(({ type, label, icon }) => (
                  <button key={type} className="header-menu-item" onClick={() => { setModal({ type }); setMenuOpen(false) }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      <div
        className={`pull-indicator${refreshing ? ' refreshing' : ''}${pullY >= PULL_THRESHOLD ? ' ready' : ''}`}
        style={!refreshing ? { height: pullY, opacity: pullY / PULL_THRESHOLD } : undefined}
      >
        {refreshing ? (
          <>
            <svg className="pull-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span className="pull-label">更新中...</span>
          </>
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
              <p className="empty-text">習慣を追加してみよう</p>
              <button className="add-first-btn" onClick={() => setModal({ type: 'add' })}>
                + 最初の習慣を追加
              </button>
              <button className="help-link-btn" onClick={() => setModal({ type: 'help' })}>
                使い方を見る
              </button>
            </div>
          ) : editMode ? (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={habits.map(h => h.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="habits-edit-list">
                    {habits.map(habit => (
                      <HabitEditItem
                        key={habit.id}
                        habit={habit}
                        onEdit={(h) => setModal({ type: 'edit', habit: h })}
                        onDelete={(h) => setModal({ type: 'deleteConfirm', habitId: h.id, habitName: h.name })}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <button
                className="add-in-edit-btn"
                onClick={() => { setEditMode(false); setModal({ type: 'add' }) }}
              >
                ＋ 習慣を追加
              </button>
            </>
          ) : (
            <div className="habits-grid">
              {habits.map(habit => (
                <HabitButton
                  key={habit.id}
                  habit={habit}
                  completed={todayRecords.includes(habit.id)}
                  streak={calcCurrentStreak(habit.id, records)}
                  onPress={(h) => toggleHabit(h.id, today)}
                  onLongPress={(h) => setModal({ type: 'longPress', habit: h })}
                />
              ))}
              <button className="add-habit-btn" onClick={() => setModal({ type: 'add' })}>
                <span className="add-icon">＋</span>
                <span>追加</span>
              </button>
            </div>
          )}
        </section>

        <section className="section">
          <Calendar
            date={calendarDate}
            onDateChange={setCalendarDate}
            habits={habits}
            records={records}
            today={today}
            onDayClick={(dateStr) => setModal({ type: 'day', dateStr })}
          />
        </section>
      </main>

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
          message="バックアップファイルをダウンロードします。"
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
        const rangeText = recordDates.length > 0
          ? `${recordDates[0]} 〜 ${recordDates[recordDates.length - 1]}`
          : 'なし'
        return (
          <ConfirmModal
            title="インポートの確認"
            message={`「${modal.filename}」をインポートします。\n\n習慣: ${modal.data.habits.length}件\n記録日数: ${recordDates.length}日\n期間: ${rangeText}\n\n⚠ 現在のデータはすべて上書きされます。\nこの操作は取り消せません。`}
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

      {modal?.type === 'deleteConfirm' && (
        <ConfirmModal
          title="習慣の削除"
          message={`「${modal.habitName}」を削除しますか？\n過去の記録もすべて削除されます。`}
          confirmLabel="削除"
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

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      <footer className="app-footer">
        <div className="app-footer-inner">
          <button className="footer-btn" onClick={() => setModal({ type: 'stats' })}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span>統計</span>
          </button>
        </div>
      </footer>
    </div>
  )
}
