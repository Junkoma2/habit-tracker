import { useState } from 'react'
import Modal from './Modal'
import { HABIT_COLORS } from '../utils/date'
import './AddHabitModal.css'

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
                aria-label={c}
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
          disabled={!name.trim()}
        >
          {isEdit ? '保存する' : '追加する'}
        </button>
      </form>
    </Modal>
  )
}
