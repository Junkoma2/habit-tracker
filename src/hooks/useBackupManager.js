import { useState, useCallback, useRef } from 'react'
import { sanitizeImportData, validateImportData } from '../utils/validation'

const LAST_BACKUP_KEY = 'habit-tracker-last-backup'
const BACKUP_DIR_NAME = 'habit-tracker-backups'
export const BACKUP_VERSION = 1

/**
 * バックアップ/リストア処理を管理するフック。
 *
 * 責務:
 * - JSONへのエクスポート（File System Access API / ダウンロードフォールバック）
 * - ファイル入力トリガー
 * - インポートファイルの検証・確認モーダル表示
 * - インポート確定時のデータ置き換え
 */
export function useBackupManager({
  habits,
  records,
  colorCategories,
  today,
  setHabits,
  setRecords,
  setColorCategories,
  setModal,
  setToast,
  statsStartDate,
  setStatsStartDate,
  modal,
}) {
  const [lastBackupDate, setLastBackupDate] = useState(() => {
    try { return localStorage.getItem(LAST_BACKUP_KEY) || null } catch { return null }
  })
  const fileInputRef = useRef(null)

  const handleExport = useCallback(async () => {
    const sanitized = sanitizeImportData({ habits, records })
    const backupData = {
      version: BACKUP_VERSION,
      ...sanitized.data,
      colorCategories,
      ...(statsStartDate ? { statsStartDate } : {}),
    }
    const json = JSON.stringify(backupData, null, 2)
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
        setToast(`バックアップを保存しました${skippedText}`)
        return
      } catch (error) {
        if (error?.name === 'AbortError') {
          setToast('保存をキャンセルしました')
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
    markSaved()
    setToast(`バックアップを保存しました${skippedText}`)
  }, [habits, records, today, colorCategories, statsStartDate, setToast])

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

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
  }, [setModal])

  const handleImportConfirm = useCallback(() => {
    if (!modal?.data) return
    const habitCount = modal.data.habits.length
    const dayCount = Object.keys(modal.data.records).length
    setHabits(modal.data.habits)
    setRecords(modal.data.records)
    if (modal.data.colorCategories) setColorCategories(modal.data.colorCategories)
    if (modal.data.statsStartDate) setStatsStartDate(modal.data.statsStartDate)
    setModal(null)
    setToast(`復元しました（${habitCount}件・${dayCount}日分）`)
  }, [modal, setHabits, setRecords, setColorCategories, setStatsStartDate, setModal, setToast])

  return {
    lastBackupDate,
    fileInputRef,
    handleExport,
    handleImportClick,
    handleFileChange,
    handleImportConfirm,
  }
}
