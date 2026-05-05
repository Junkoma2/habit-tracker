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
    body: '実績画面では達成した日が色の点で見えます。日付を開くと、その日の内容を確認できます。',
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
    hint: '「毎日30分勉強」より「参考書を1ページ開く」のように、すぐできる形にすると始めやすくなります。',
    design: 'だから、習慣は名前と色だけですぐ追加でき、今日の画面で迷わず押せるようにしています。',
  },
  {
    title: '忘れても戻れるようにする',
    feature: '長押し・日付詳細',
    hint: '1日忘れただけで終わりにすると、続ける気持ちも切れやすくなります。',
    design: 'だから、長押しや日付詳細から昨日まで直せるようにしています。',
  },
  {
    title: '見える形で積み上げる',
    feature: '実績',
    hint: '達成した日が見えると、続けている感覚をつかみやすくなります。',
    design: 'だから、実績画面では日ごとの達成を色の点と件数で見られるようにしています。',
  },
  {
    title: '流れで振り返る',
    feature: '分析',
    hint: '毎日の結果だけでなく、最近の流れが見えると調整しやすくなります。',
    design: 'だから、分析では連続日数、累計、直近30日の達成率をまとめて確認できます。',
  },
  {
    title: '増やしすぎない',
    feature: '習慣一覧',
    hint: '習慣が多すぎると、記録するだけで重くなります。',
    design: 'だから、今日の画面は一覧を軽く押せる作りにして、編集画面で並び替えや終了もできるようにしています。',
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
                  <p className="help-card-body help-tip-hint">{item.hint}</p>
                  <p className="help-card-body help-tip-design">{item.design}</p>
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
