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
import { getToday, getYesterday } from './utils/date'
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
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)
  const [longPressHabit, setLongPressHabit] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [importConfirm, setImportConfirm] = useState(null)
  const [importError, setImportError] = useState(null)

  const today = getToday()
  const yesterday = getYesterday()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ habits, records }))
  }, [habits, records])

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
    setShowAddModal(false)
  }, [])

  const updateHabit = useCallback(({ name, color }) => {
    setHabits(prev =>
      prev.map(h => h.id === editingHabit.id ? { ...h, name, color } : h)
    )
    setEditingHabit(null)
  }, [editingHabit])

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

  const isEditableDate = useCallback((dateStr) => {
    return dateStr === today || dateStr === yesterday
  }, [today, yesterday])

  const todayRecords = records[today] || []

  const leaveEditMode = () => setEditMode(false)

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
        if (!Array.isArray(data.habits) || typeof data.records !== 'object') {
          throw new Error()
        }
        setImportConfirm({ data, filename: file.name })
      } catch {
        setImportError('ファイルの形式が正しくありません。')
      }
      e.target.value = ''
    }
    reader.readAsText(file)
  }, [])

  const handleImportConfirm = useCallback(() => {
    if (!importConfirm) return
    setHabits(importConfirm.data.habits)
    setRecords(importConfirm.data.records)
    setImportConfirm(null)
  }, [importConfirm])

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">習慣トラッカー</h1>
        <div className="header-actions">
          <button className="header-btn" onClick={() => setShowHelp(true)} title="使い方">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>ヘルプ</span>
          </button>
          <button className="header-btn" onClick={handleExport} title="バックアップ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>保存</span>
          </button>
          <button className="header-btn" onClick={handleImportClick} title="復元">
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
              <button className="add-first-btn" onClick={() => setShowAddModal(true)}>
                + 最初の習慣を追加
              </button>
              <button className="help-link-btn" onClick={() => setShowHelp(true)}>
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
                        onEdit={setEditingHabit}
                        onDelete={deleteHabit}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <button
                className="add-in-edit-btn"
                onClick={() => { leaveEditMode(); setShowAddModal(true) }}
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
                  onLongPress={setLongPressHabit}
                />
              ))}
              <button className="add-habit-btn" onClick={() => setShowAddModal(true)}>
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
            onDayClick={setSelectedDay}
          />
        </section>
      </main>

      {showAddModal && (
        <AddHabitModal
          onSave={addHabit}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingHabit && (
        <AddHabitModal
          initialHabit={editingHabit}
          onSave={updateHabit}
          onClose={() => setEditingHabit(null)}
        />
      )}

      {longPressHabit && (
        <LongPressModal
          habit={longPressHabit}
          today={today}
          yesterday={yesterday}
          isCompletedToday={todayRecords.includes(longPressHabit.id)}
          isCompletedYesterday={(records[yesterday] || []).includes(longPressHabit.id)}
          onSelect={(dateStr) => {
            toggleHabit(longPressHabit.id, dateStr)
            setLongPressHabit(null)
          }}
          onClose={() => setLongPressHabit(null)}
        />
      )}

      {showHelp && (
        <HelpModal onClose={() => setShowHelp(false)} />
      )}

      {importConfirm && (
        <ConfirmModal
          message={`「${importConfirm.filename}」をインポートします。\n現在のデータはすべて上書きされます。よろしいですか？`}
          confirmLabel="インポート"
          danger={false}
          onConfirm={handleImportConfirm}
          onClose={() => setImportConfirm(null)}
        />
      )}

      {importError && (
        <ConfirmModal
          message={importError}
          confirmLabel="OK"
          showCancel={false}
          onConfirm={() => setImportError(null)}
          onClose={() => setImportError(null)}
        />
      )}

      {selectedDay && (
        <DayDetailModal
          dateStr={selectedDay}
          habits={habits}
          completedIds={records[selectedDay] || []}
          isEditable={isEditableDate(selectedDay)}
          onToggle={(habitId) => toggleHabit(habitId, selectedDay)}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  )
}
