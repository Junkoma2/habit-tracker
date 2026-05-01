import Modal from './Modal'
import './HelpModal.css'

export default function HelpModal({ onClose }) {
  return (
    <Modal onClose={onClose} title="使い方">
      <div className="help-content">
        <section className="help-section">
          <h3 className="help-heading">今日の習慣</h3>
          <ul className="help-list">
            <li>習慣ボタンをタップすると当日の達成をトグルできます</li>
            <li>長押し（0.5秒）すると今日・昨日を選んで記録できます</li>
            <li>「編集」ボタンで並び替え・名前変更・削除ができます</li>
          </ul>
        </section>

        <section className="help-section">
          <h3 className="help-heading">カレンダー</h3>
          <ul className="help-list">
            <li>各日付のドットは達成した習慣の色を表します</li>
            <li>日付をタップすると詳細が確認できます</li>
            <li>当日・前日のみ詳細画面から記録を編集できます</li>
          </ul>
        </section>

        <section className="help-section">
          <h3 className="help-heading">バックアップ・復元</h3>
          <ul className="help-list">
            <li>「保存」でデータをJSONファイルとしてダウンロードできます</li>
            <li>「復元」でJSONファイルを読み込んでデータを上書きできます</li>
          </ul>
        </section>

        <section className="help-section">
          <h3 className="help-heading">データ保存先</h3>
          <ul className="help-list">
            <li>データはこの端末のブラウザ内に保存されます</li>
            <li>ブラウザのデータを消去するとリセットされます</li>
          </ul>
        </section>
      </div>

      <button className="help-close-btn" onClick={onClose}>閉じる</button>
    </Modal>
  )
}
