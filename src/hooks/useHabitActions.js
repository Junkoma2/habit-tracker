import { useState, useCallback, useRef } from 'react'
import { arrayMove } from '@dnd-kit/sortable'

/**
 * 習慣のCRUD操作とundo機能を管理するフック。
 *
 * 責務:
 * - 習慣の追加・編集・削除・アーカイブ・復元
 * - 記録の切り替え（toggle）とundo
 * - ドラッグによる並び替え
 */
export function useHabitActions({ records, today, setHabits, setRecords, setModal, onAddHabit }) {
  const [undoAction, setUndoAction] = useState(null)
  const undoTimerRef = useRef(null)

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
  }, [records, setRecords])

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
  }, [undoAction, setRecords])

  const addHabit = useCallback(({ name, color }) => {
    const id = `h_${Date.now()}`
    setHabits(prev => [...prev, { id, name, color, createdAt: today }])
    setModal(null)
    onAddHabit?.()
  }, [today, setHabits, setModal, onAddHabit])

  // updateHabit は modal.habit.id が必要なため、habitId を明示的に引数として受け取る
  const updateHabit = useCallback(({ name, color, habitId }) => {
    setHabits(prev =>
      prev.map(h => h.id === habitId ? { ...h, name, color } : h)
    )
    setModal(null)
  }, [setHabits, setModal])

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
  }, [setHabits, setRecords, setModal])

  const archiveHabit = useCallback((habitId) => {
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, archivedAt: today } : h))
    setModal(null)
  }, [today, setHabits, setModal])

  const restoreHabit = useCallback((habitId) => {
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, archivedAt: null } : h))
    setModal(null)
  }, [setHabits, setModal])

  const handleDragEnd = useCallback(({ active, over }) => {
    if (over && active.id !== over.id) {
      setHabits(prev => {
        const oldIndex = prev.findIndex(h => h.id === active.id)
        const newIndex = prev.findIndex(h => h.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }, [setHabits])

  return {
    undoAction,
    toggleHabit,
    handleUndo,
    addHabit,
    updateHabit,
    deleteHabit,
    archiveHabit,
    restoreHabit,
    handleDragEnd,
  }
}
