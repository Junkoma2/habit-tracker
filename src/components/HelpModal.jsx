import Modal, { useModalClose } from './Modal'
import './HelpModal.css'

const HOW_TO_ITEMS = [
  {
    title: '習慣を追加する',
    body: '習慣画面の追加ボタンから、毎日記録したい行動を1つ登録します。',
  },
  {
    title: '今日の達成をつける',
    body: '習慣ボタンをタップすると、今日の記録をオン/オフできます。長押しすると昨日の記録も選べます。',
  },
  {
    title: 'カレンダーで振り返る',
    body: '記録画面では達成した日が色の点で見えます。日付を開くと、その日の内容を確認できます。',
  },
  {
    title: '分析で流れを見る',
    body: '分析画面では現在の連続、最長連続、累計、直近30日の達成率を確認できます。',
  },
  {
    title: '設定で整える',
    body: '設定画面ではテーマカラーを変えたり、バックアップの保存と復元ができます。',
  },
]

const TIP_ITEMS = [
  {
    title: '小さく始める',
    feature: '習慣追加',
    body: '「毎日30分勉強」より「参考書を1ページ開く」のように、すぐできる形で登録します。',
  },
  {
    title: '毎日見る場所に記録する',
    feature: 'カレンダー',
    body: '達成した日が見えると、続けている感覚をつかみやすくなります。',
  },
  {
    title: '続かなかった日を責めない',
    feature: 'カレンダー・分析',
    body: '空白の日があっても、次の日から再開できれば十分です。流れを見て戻りやすくします。',
  },
  {
    title: 'まとめて振り返る',
    feature: '分析',
    body: '週や月の終わりに、連続日数や直近30日の達成率を軽く見直します。',
  },
  {
    title: '増やしすぎない',
    feature: '習慣一覧・設定',
    body: 'まずは1〜3個くらいに絞ると、入力が軽くなり続けやすくなります。',
  },
]

function HelpCloseButton() {
  const close = useModalClose()
  return <button className="help-close-btn" onClick={close}>閉じる</button>
}

export default function HelpModal({ onClose }) {
  return (
    <Modal onClose={onClose} title="使い方">
      <div className="help-content">
        <section className="help-section">
          <h3 className="help-heading">最初にやること</h3>
          <div className="help-card-list">
            {HOW_TO_ITEMS.map((item, index) => (
              <article className="help-card" key={item.title}>
                <span className="help-step">{index + 1}</span>
                <div>
                  <h4 className="help-card-title">{item.title}</h4>
                  <p className="help-card-body">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="help-section">
          <h3 className="help-heading">続けるためのヒント</h3>
          <div className="help-card-list">
            {TIP_ITEMS.map(item => (
              <article className="help-card help-tip-card" key={item.title}>
                <div>
                  <div className="help-card-title-row">
                    <h4 className="help-card-title">{item.title}</h4>
                    <span className="help-feature">{item.feature}</span>
                  </div>
                  <p className="help-card-body">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="help-section">
          <h3 className="help-heading">データについて</h3>
          <p className="help-note">
            記録はこの端末のブラウザに保存されます。機種変更やブラウザのデータ削除に備えて、設定画面からバックアップを保存できます。
          </p>
        </section>
      </div>

      <p className="help-version">バージョン {__APP_VERSION__}</p>
      <HelpCloseButton />
    </Modal>
  )
}
