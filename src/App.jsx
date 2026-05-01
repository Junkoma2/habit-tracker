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
import { getToday, getYesterday } from './utils/date'
import { validateImportData } from './utils/validation'
import './App.css'

const STORAGE_KEY = 'habit-tracker-v1'

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { habits: [], records: {} }
}

const _initial = loadData()

export default function App() {
  const [habits, setHabits] = useState(_initial.habits)
  const [records, setRecords] = useState(_initial.records)
  const [calendarDate, setCalendarDate] = useState(() => new Date())
  const [editMode, setEditMode] = useState(false)
  const [modal, setModal] = useState(null)
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const pullStartY = useRef(null)
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
    setHabits(prev => [...prev, { id, name, color }])
    setModal(null)
  }, [])

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
  }, [habits, records, today])

  const handleImportClick = () => fileInputRef.current?.click()

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
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

  const handleImportConfirm = useCallback(() => {
    setHabits(modal.data.habits)
    setRecords(modal.data.records)
    setModal(null)
  }, [modal])

  const handleTouchStart = useCallback((e) => {
    if (window.scrollY === 0) {
      pullStartY.current = e.touches[0].clientY
    }
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (pullStartY.current === null) return
    const dy = e.touches[0].clientY - pullStartY.current
    if (dy > 0) {
      setPullY(Math.min(dy * 0.4, PULL_THRESHOLD + 16))
    } else {
      pullStartY.current = null
      setPullY(0)
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (pullY >= PULL_THRESHOLD) {
      setRefreshing(true)
      setPullY(0)
      const fresh = loadData()
      setHabits(fresh.habits)
      setRecords(fresh.records)
      setTimeout(() => setRefreshing(false), 700)
    } else {
      setPullY(0)
    }
    pullStartY.current = null
  }, [pullY])

  return (
    <div
      className="app"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={`pull-indicator${refreshing ? ' refreshing' : ''}${pullY >= PULL_THRESHOLD ? ' ready' : ''}`}
        style={!refreshing ? { height: pullY, opacity: pullY / PULL_THRESHOLD } : undefined}
      >
        {refreshing ? (
          <svg className="pull-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : (
          <svg
            className={`pull-arrow${pullY >= PULL_THRESHOLD ? ' flip' : ''}`}
            width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="19 12 12 19 5 12" />
          </svg>
        )}
      </div>

      <header className="app-header">
        <h1 className="app-title">習慣トラッカー</h1>
        <div className="header-actions">
          <button className="header-btn" onClick={() => setModal({ type: 'stats' })} title="統計">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span>統計</span>
          </button>
          <button className="header-btn" onClick={() => setModal({ type: 'help' })} title="使い方">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>ヘルプ</span>
          </button>
          <button className="header-btn" onClick={() => setModal({ type: 'exportConfirm' })} title="バックアップ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>保存</span>
          </button>
          <button className="header-btn" onClick={() => setModal({ type: 'importConfirm' })} title="復元">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>復元</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      </header>

      <main className="app-main">
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
          message="バックアップファイルをダウンロードします。"
          confirmLabel="ダウンロード"
          danger={false}
          onConfirm={() => { handleExport(); closeModal() }}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'importConfirm' && (
        <ConfirmModal
          message={`バックアップファイルを選択して復元します。\n現在のデータは上書きされます。`}
          confirmLabel="ファイルを選択"
          danger={true}
          onConfirm={() => { closeModal(); handleImportClick() }}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'importFile' && (
        <ConfirmModal
          message={`「${modal.filename}」をインポートします。\n現在のデータはすべて上書きされます。よろしいですか？`}
          confirmLabel="インポート"
          danger={false}
          onConfirm={handleImportConfirm}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'importError' && (
        <ConfirmModal
          message={modal.message}
          confirmLabel="OK"
          showCancel={false}
          onConfirm={closeModal}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'deleteConfirm' && (
        <ConfirmModal
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
    </div>
  )
}
