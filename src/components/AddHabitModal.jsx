import { useState, useRef, useEffect } from 'react'
import Modal from './Modal'
import { HABIT_COLORS } from '../utils/date'
import './AddHabitModal.css'

const MAX_NAME_LENGTH = 20

const COLOR_NAMES = {
  '#FF6B6B': 'レッド',
  '#FF9F43': 'オレンジ',
  '#FECA57': 'イエロー',
  '#48DBB4': 'グリーン',
  '#54A0FF': 'ブルー',
  '#A29BFE': 'ラベンダー',
  '#FD79A8': 'ピンク',
  '#6C5CE7': 'パープル',
}

export default function AddHabitModal({ onSave, onClose, initialHabit = null, colorCategories = {} }) {
  const isEdit = !!initialHabit
  const [name, setName] = useState(initialHabit?.name ?? '')
  const [color, setColor] = useState(initialHabit?.color ?? HABIT_COLORS[0])
  const [showNameError, setShowNameError] = useState(false)
  const nameInputRef = useRef(null)

  // モーダルを開いたとき名前欄にフォーカスする
  // autoFocus属性はiOS Safariで動作しないため useEffect + ref で実装
  useEffect(() => {
    const timer = setTimeout(() => {
      nameInputRef.current?.focus()
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) { setShowNameError(true); return }
    setShowNameError(false)
    onSave({ name: trimmed, color })
  }

  const remaining = MAX_NAME_LENGTH - name.length
  const isAtLimit = remaining === 0
  const isNearLimit = remaining <= 5

  return (
    <Modal onClose={onClose} title={isEdit ? `「${initialHabit.name}」を編集` : '習慣を追加'}>
      <form onSubmit={handleSubmit} className="add-form">
        <div className="form-group">
          <div className="form-label-row">
            <label className="form-label" htmlFor="habit-name-input">名前</label>
            <span
              className={`char-counter${isAtLimit ? ' at-limit' : isNearLimit ? ' near-limit' : ''}`}
              aria-live="polite"
              aria-label={`残り${remaining}文字`}
            >
              {name.length}/{MAX_NAME_LENGTH}
            </span>
          </div>
          <input
            id="habit-name-input"
            className="form-input"
            type="text"
            placeholder="例：ランニング、読書..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_NAME_LENGTH}
            aria-invalid={showNameError}
          />
          {showNameError && (
            <p className="field-error" role="alert" aria-live="assertive">名前を入力してください</p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">
            カラー
            {colorCategories[color] && (
              <span className="color-name-hint">{colorCategories[color]}</span>
            )}
          </label>
          <div className="color-grid">
            {HABIT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`color-swatch ${color === c ? 'selected' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
                aria-label={`${colorCategories[c] || COLOR_NAMES[c] || c}${color === c ? '（選択中）' : ''}`}
                aria-pressed={color === c}
              />
            ))}
          </div>
        </div>

        <div className="preview-row">
          <div
            className="habit-preview"
            style={{ borderColor: color, color: color }}
          >
            <span className="preview-dot" style={{ backgroundColor: color }} />
            <span>{name || 'プレビュー'}</span>
          </div>
          <div
            className="habit-preview completed"
            style={{ backgroundColor: color }}
          >
            <span className="preview-dot" style={{ backgroundColor: '#fff' }} />
            <span>{name || 'プレビュー'}</span>
          </div>
        </div>

        <button
          type="submit"
          className="submit-btn"
        >
          {isEdit ? '保存する' : '追加する'}
        </button>
      </form>
    </Modal>
  )
}
