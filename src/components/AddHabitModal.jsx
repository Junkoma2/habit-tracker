import { useState } from 'react'
import Modal from './Modal'
import { HABIT_COLORS } from '../utils/date'
import './AddHabitModal.css'

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

const COLOR_HINTS = {
  '#FF6B6B': '生活・日課系',
  '#FF9F43': '社交・コミュニティ系',
  '#FECA57': '創作・趣味系',
  '#48DBB4': '健康・運動系',
  '#54A0FF': '学習・勉強系',
  '#A29BFE': 'マインドフル・休息系',
  '#FD79A8': 'セルフケア系',
  '#6C5CE7': '集中・スキル系',
}

export default function AddHabitModal({ onSave, onClose, initialHabit = null }) {
  const isEdit = !!initialHabit
  const [name, setName] = useState(initialHabit?.name ?? '')
  const [color, setColor] = useState(initialHabit?.color ?? HABIT_COLORS[0])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSave({ name: trimmed, color })
  }

  return (
    <Modal onClose={onClose} title={isEdit ? '習慣を編集' : '習慣を追加'}>
      <form onSubmit={handleSubmit} className="add-form">
        <div className="form-group">
          <label className="form-label">名前</label>
          <input
            className="form-input"
            type="text"
            placeholder="例：ランニング、読書..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={20}
          />
        </div>

        <div className="form-group">
          <label className="form-label">カラー</label>
          <div className="color-grid">
            {HABIT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`color-swatch ${color === c ? 'selected' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
                aria-label={`${COLOR_NAMES[c] || c}${color === c ? '（選択中）' : ''}`}
                aria-pressed={color === c}
              />
            ))}
          </div>
          {COLOR_HINTS[color] && (
            <p className="color-hint">おすすめ：{COLOR_HINTS[color]}</p>
          )}
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
          disabled={!name.trim()}
        >
          {isEdit ? '保存する' : '追加する'}
        </button>
      </form>
    </Modal>
  )
}
