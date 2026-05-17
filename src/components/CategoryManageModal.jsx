import { useState } from 'react'
import Modal from './Modal'
import { HABIT_COLORS } from '../utils/date'
import './CategoryManageModal.css'

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

export default function CategoryManageModal({ colorCategories, onUpdate, onClose }) {
  const [draft, setDraft] = useState({ ...colorCategories })

  const handleChange = (color, value) => {
    setDraft(prev => ({ ...prev, [color]: value }))
  }

  const handleSave = () => {
    const cleaned = Object.fromEntries(
      Object.entries(draft).filter(([, v]) => v.trim() !== '')
    )
    onUpdate(cleaned)
    onClose()
  }

  return (
    <Modal title="色の名前を設定" onClose={onClose}>
      <p className="cat-description">色に名前をつけておくと、分析画面でグループ表示されます。設定しなくても使えます。</p>
      <div className="cat-color-list">
        {HABIT_COLORS.map(color => (
          <div key={color} className="cat-color-row">
            <span className="cat-color-swatch" style={{ backgroundColor: color }} />
            <span className="cat-color-label">{COLOR_NAMES[color]}</span>
            <input
              className="cat-input"
              type="text"
              value={draft[color] ?? ''}
              onChange={e => handleChange(color, e.target.value)}
              placeholder="色の名前（任意）"
              maxLength={20}
            />
          </div>
        ))}
      </div>
      <button className="cat-save-all-btn" onClick={handleSave}>
        保存する
      </button>
    </Modal>
  )
}
