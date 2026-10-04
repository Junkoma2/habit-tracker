import './StorageRecoveryNotice.css'

export default function StorageRecoveryNotice({ onDismiss }) {
  return (
    <div className="storage-recovery" role="alert">
      <p className="storage-recovery-title">保存データを読み込めませんでした</p>
      <p className="storage-recovery-body">
        元のデータは別の場所に残してあります。このまま新しく始めるまでは、いまの内容は保存されません。
      </p>
      <button type="button" className="storage-recovery-btn" onClick={onDismiss}>
        新しく始める
      </button>
    </div>
  )
}
