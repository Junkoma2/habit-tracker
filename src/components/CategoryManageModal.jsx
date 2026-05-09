import { useState } from 'react'
import Modal from './Modal'
import './CategoryManageModal.css'

export default function CategoryManageModal({ categories, onAdd, onUpdate, onDelete, onClose }) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return
    onAdd({ id: `cat_${Date.now()}`, name })
    setNewName('')
  }

  const handleUpdate = (id) => {
    const name = editingName.trim()
    if (!name) return
    onUpdate(id, name)
    setEditingId(null)
  }

  const startEdit = (cat) => {
    setEditingId(cat.id)
    setEditingName(cat.name)
  }

  return (
    <Modal title="カテゴリ管理" onClose={onClose}>
      {categories.length === 0 ? (
        <p className="cat-empty">まだカテゴリがありません。下から追加してください。</p>
      ) : (
        <ul className="cat-list">
          {categories.map(cat => (
            <li key={cat.id} className="cat-item">
              {editingId === cat.id ? (
                <div className="cat-edit-row">
                  <input
                    className="cat-input"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleUpdate(cat.id) }}
                    autoFocus
                    maxLength={20}
                  />
                  <button className="cat-save-btn" onClick={() => handleUpdate(cat.id)} disabled={!editingName.trim()}>
                    保存
                  </button>
                  <button className="cat-cancel-btn" onClick={() => setEditingId(null)}>
                    キャンセル
                  </button>
                </div>
              ) : (
                <div className="cat-row">
                  <span className="cat-name">{cat.name}</span>
                  <div className="cat-actions">
                    <button className="cat-edit-btn" onClick={() => startEdit(cat)}>編集</button>
                    <button className="cat-delete-btn" onClick={() => onDelete(cat.id)}>削除</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="cat-add-row">
        <input
          className="cat-input"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          placeholder="新しいカテゴリ名"
          maxLength={20}
        />
        <button className="cat-add-btn" onClick={handleAdd} disabled={!newName.trim()}>
          追加
        </button>
      </div>
    </Modal>
  )
}
