import { useState, useEffect } from 'react'

const STORAGE_KEY = 'habit-tracker-v1'
const SETTINGS_KEY = 'habit-tracker-settings'

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
          colorCategories: (
            data.colorCategories &&
            typeof data.colorCategories === 'object' &&
            !Array.isArray(data.colorCategories)
          ) ? data.colorCategories : {},
        }
      }
    }
  } catch {}
  return { habits: [], records: {}, colorCategories: {} }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (s && typeof s === 'object') return s
    }
  } catch {}
  return {}
}

const _initial = loadData()
const _initialSettings = loadSettings()

export function useHabitsStorage({ onSaveError } = {}) {
  const [habits, setHabits] = useState(_initial.habits)
  const [records, setRecords] = useState(_initial.records)
  const [colorCategories, setColorCategories] = useState(_initial.colorCategories)
  // 集計開始日（YYYY-MM-DD 形式。未設定なら null）
  const [statsStartDate, setStatsStartDate] = useState(_initialSettings.statsStartDate ?? null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ habits, records, colorCategories }))
    } catch {
      onSaveError?.('データの保存に失敗しました。ストレージの空き容量が不足しています。')
    }
  }, [habits, records, colorCategories, onSaveError])

  useEffect(() => {
    try {
      const settings = {}
      if (statsStartDate) settings.statsStartDate = statsStartDate
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch {
      onSaveError?.('設定の保存に失敗しました。ストレージの空き容量が不足しています。')
    }
  }, [statsStartDate, onSaveError])

  return { habits, records, colorCategories, statsStartDate, setHabits, setRecords, setColorCategories, setStatsStartDate }
}
