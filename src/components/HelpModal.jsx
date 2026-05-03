import Modal from './Modal'
import './HelpModal.css'

export default function HelpModal({ onClose }) {
  return (
    <Modal onClose={onClose} title="使い方">
      <div className="help-content">
        <section className="help-section">
          <h3 className="help-heading">習慣を記録する</h3>
          <ul className="help-list">
            <li>習慣ボタンをタップすると今日の達成をオン／オフできます。</li>
            <li>長押し（0.5秒）すると今日・昨日を選んで記録できます。うっかり忘れたときに便利です。</li>
            <li>「編集」ボタンで習慣の並び替え・名前変更・削除ができます。</li>
          </ul>
        </section>

        <section className="help-section">
          <h3 className="help-heading">カレンダーで振り返る</h3>
          <ul className="help-list">
            <li>達成した習慣がその色のドットで表示されます。</li>
            <li>日付をタップするとその日の記録を確認できます。</li>
            <li>当日と前日だけ、タップした画面から記録を修正できます。</li>
          </ul>
        </section>

        <section className="help-section">
          <h3 className="help-heading">統計を見る</h3>
          <ul className="help-list">
            <li>画面下の「統計」ボタンから習慣ごとの記録を確認できます。</li>
            <li>「現在の連続日数」「最長連続日数」「累計達成回数」が表示されます。</li>
            <li>今日がまだ未達でも、昨日まで連続していれば連続日数は維持されます。</li>
          </ul>
        </section>

        <section className="help-section">
          <h3 className="help-heading">画面を更新する</h3>
          <ul className="help-list">
            <li>画面を下に引っ張って離すと最新の状態に更新されます。</li>
            <li>「更新中...」と表示されたら離してください。アプリの更新があれば自動で反映されます。</li>
          </ul>
        </section>

        <section className="help-section">
          <h3 className="help-heading">データのバックアップ・復元</h3>
          <ul className="help-list">
            <li>設定の「バックアップを保存」でデータをファイルとしてダウンロードできます。</li>
            <li>「バックアップから復元」でファイルを読み込んでデータを元に戻せます。機種変更のときにも使えます。</li>
            <li>復元すると現在のデータはすべて上書きされます。</li>
          </ul>
        </section>

        <section className="help-section">
          <h3 className="help-heading">プライバシーについて</h3>
          <ul className="help-list">
            <li>データはこの端末のブラウザだけに保存されます。外部サーバーには送られないので、他の人に見られる心配はありません。</li>
            <li>ブラウザの「サイトデータを消去」を行うとデータが消えます。定期的にバックアップをおすすめします。</li>
          </ul>
        </section>
      </div>

      <p className="help-version">バージョン {__APP_VERSION__}</p>
      <button className="help-close-btn" onClick={onClose}>閉じる</button>
    </Modal>
  )
}
