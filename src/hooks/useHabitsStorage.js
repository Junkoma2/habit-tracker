import { useState, useEffect } from 'react'

const STORAGE_KEY = 'habit-tracker-v1'

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (
        data && typeof data === 'object' && !Array.isArray(data) &&
        Array.isArray(data.habits) &&
        data.records && typeof data.records === 'object' && !Array.isArray(data.records)
      ) {
        return {
          habits: data.habits,
          records: data.records,
          categories: Array.isArray(data.categories) ? data.categories : [],
        }
      }
    }
  } catch {}
  return { habits: [], records: {}, categories: [] }
}

const _initial = loadData()

export function useHabitsStorage() {
  const [habits, setHabits] = useState(_initial.habits)
  const [records, setRecords] = useState(_initial.records)
  const [categories, setCategories] = useState(_initial.categories)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ habits, records, categories }))
  }, [habits, records, categories])

  return { habits, records, categories, setHabits, setRecords, setCategories }
}
