import { useState, useEffect, useRef, useCallback } from 'react'

const STORAGE_KEY = 'habit-tracker-v1'
const SETTINGS_KEY = 'habit-tracker-settings'

export const CORRUPT_BACKUP_KEY = 'habit-tracker-v1-corrupt-backup'

function emptyData() {
  return { habits: [], records: {}, colorCategories: {} }
}

function isPlainObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

// 保存データを読み、状態を ok / empty / corrupt で返す。corrupt のときは元の文字列も返す
export function inspectStoredData(storage) {
  let raw
  try {
    raw = (storage ?? localStorage).getItem(STORAGE_KEY)
  } catch {
    return { status: 'empty', data: emptyData(), raw: null }
  }
  if (!raw) return { status: 'empty', data: emptyData(), raw: null }
  try {
    const data = JSON.parse(raw)
    if (isPlainObject(data) && Array.isArray(data.habits) && isPlainObject(data.records)) {
      return {
        status: 'ok',
        raw,
        data: {
          habits: data.habits,
          records: data.records,
          colorCategories: isPlainObject(data.colorCategories) ? data.colorCategories : {},
        },
      }
    }
  } catch {}
  return { status: 'corrupt', data: emptyData(), raw }
}

// 読めなかった元の文字列を別キーへ退避する。退避済みの内容は上書きしない
export function quarantineCorruptData(raw, storage) {
  try {
    storage = storage ?? localStorage
    if (storage.getItem(CORRUPT_BACKUP_KEY) === null) {
      storage.setItem(CORRUPT_BACKUP_KEY, raw)
    }
    return true
  } catch {
    return false
  }
}

export function loadData() {
  return inspectStoredData().data
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

const _initialInspect = inspectStoredData()
const _initial = _initialInspect.data
// 読めなかった元データは起動時に一度だけ退避する
const _initialCorrupt = _initialInspect.status === 'corrupt'
if (_initialCorrupt) quarantineCorruptData(_initialInspect.raw)
const _initialSettings = loadSettings()

export function useHabitsStorage({ onSaveError } = {}) {
  const [habits, setHabits] = useState(_initial.habits)
  const [records, setRecords] = useState(_initial.records)
  const [colorCategories, setColorCategories] = useState(_initial.colorCategories)
  // 集計開始日（YYYY-MM-DD 形式。未設定なら null）
  // 読めなかったデータがあるうちは、空の状態で元データを上書きしない
  const [recoveryNotice, setRecoveryNotice] = useState(_initialCorrupt)
  const saveBlockedRef = useRef(_initialCorrupt)
  const dismissRecoveryNotice = useCallback(() => {
    saveBlockedRef.current = false
    setRecoveryNotice(false)
  }, [])
  const [statsStartDate, setStatsStartDate] = useState(_initialSettings.statsStartDate ?? null)

  useEffect(() => {
    if (saveBlockedRef.current) return
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

  // 他タブの書き込みを検知して最新データを読み直す（後書きタブによる上書き消失を防ぐ）
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY || e.key === null) {
        const data = loadData()
        setHabits(data.habits)
        setRecords(data.records)
        setColorCategories(data.colorCategories)
      }
      if (e.key === SETTINGS_KEY || e.key === null) {
        setStatsStartDate(loadSettings().statsStartDate ?? null)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return { habits, records, colorCategories, statsStartDate, recoveryNotice, dismissRecoveryNotice, setHabits, setRecords, setColorCategories, setStatsStartDate }
}
