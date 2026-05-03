import Modal from './Modal'
import './ConfirmModal.css'

export default function ConfirmModal({ message, confirmLabel, onConfirm, onClose, danger = true, showCancel = true, title }) {
  return (
    <Modal onClose={onClose} title={title ?? confirmLabel}>
      <div className="confirm-body">
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          {showCancel && (
            <button className="confirm-cancel" onClick={onClose}>キャンセル</button>
          )}
          <button className={`confirm-ok ${danger ? 'danger' : 'safe'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
