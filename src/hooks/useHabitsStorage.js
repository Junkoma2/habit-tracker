import { useState, useEffect } from 'react'

const STORAGE_KEY = 'habit-tracker-v1'
const SETTINGS_KEY = 'habit-tracker-settings'

// 未達成日の扱いモード (#294)
export const STREAK_MODES = [
  { id: 'reset',       label: 'リセットする',    metricLabel: '連続日数',                desc: '未達成の翌日から連続日数が0に戻ります' },
  { id: 'decrement',   label: '1日分だけ戻す',   metricLabel: '週何回ペースで続いている', desc: '未達成の日は連続日数が1減ります' },
  { id: 'accumulate',  label: '減らさない',       metricLabel: '週何回ペースで続いている', desc: '未達成の日があっても連続日数は変わりません' },
]
export const DEFAULT_STREAK_MODE = 'decrement'

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
  // #294: 未達成日の扱いモード
  const [streakMode, setStreakMode] = useState(_initialSettings.streakMode ?? DEFAULT_STREAK_MODE)

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
      settings.streakMode = streakMode
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch {
      onSaveError?.('設定の保存に失敗しました。ストレージの空き容量が不足しています。')
    }
  }, [statsStartDate, streakMode, onSaveError])

  return { habits, records, colorCategories, statsStartDate, streakMode, setHabits, setRecords, setColorCategories, setStatsStartDate, setStreakMode }
}
