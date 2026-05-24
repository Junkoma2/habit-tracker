import Modal, { useModalClose } from './Modal'
import './HelpModal.css'

const STEPS = [
  {
    title: '習慣を追加する',
    body: [
      '最初に、続けたい習慣を登録します。',
      '小さく始めるほど、習慣は続きやすくなります。',
    ],
    examples: ['水を飲む', '5分だけ勉強する', 'ストレッチする'],
    tags: ['記録'],
  },
  {
    title: '今日できたら記録する',
    body: [
      'できた日はタップして記録します。',
      '思い出した瞬間にすぐ記録できるよう、操作はシンプルにしています。',
      '前日分は長押しで記録できます。それより前の日は変更できません。',
    ],
    tags: ['記録'],
  },
  {
    title: 'カレンダーで振り返る',
    body: [
      'ホーム画面のカレンダーで、続けた日を一目で確認できます。',
      '日付をタップすると、その日の達成内容が開きます。',
    ],
    tags: ['記録'],
  },
  {
    title: '分析を見る',
    body: [
      '直近の達成率や曜日ごとの傾向を確認できます。',
      '完璧を目指すより、「次にどう続けるか」を考えるための機能です。',
    ],
    tags: ['分析'],
  },
  {
    title: '自分に合った形で続ける',
    body: [
      '数日できなかったとしても問題ありません。',
      'また今日から再開できれば、それも立派な継続です。',
      'このアプリは、「やめずに戻ってこられること」を大切にしています。',
    ],
    tags: ['記録', '分析'],
  },
]

function HelpCloseButton() {
  const close = useModalClose()
  return <button className="help-close-btn" onClick={close}>閉じる</button>
}

function HelpTags({ tags }) {
  return (
    <div className="help-tag-row">
      {tags.map(tag => (
        <span className="help-tag" key={tag}>{tag}</span>
      ))}
    </div>
  )
}

export default function HelpModal({ onClose }) {
  return (
    <Modal onClose={onClose} title="使い方">
      <div className="help-content">
        <section className="help-section">
          <h3 className="help-heading">はじめ方</h3>
          <p className="help-intro">
            まずは、続けたい習慣を1つ登録してみましょう。
            無理なく続けることを意識して作りました。
          </p>
        </section>

        {STEPS.map((step, index) => (
          <section className="help-section" key={step.title}>
            <article className="help-card">
              <span className="help-step">{index + 1}</span>
              <div className="help-card-main">
                <h4 className="help-card-title">{step.title}</h4>
                {step.body.map(paragraph => (
                  <p className="help-card-body" key={paragraph}>{paragraph}</p>
                ))}
                {step.examples && (
                  <ul className="help-example-list">
                    {step.examples.map(example => (
                      <li key={example}>{example}</li>
                    ))}
                  </ul>
                )}
                <HelpTags tags={step.tags} />
              </div>
            </article>
          </section>
        ))}

        <section className="help-section">
          <h3 className="help-heading">データについて</h3>
          <p className="help-note">
            記録データは、この端末のブラウザ内に保存されます。
            バックアップや復元は設定画面から行えます。
          </p>
          <HelpTags tags={['設定']} />
        </section>
      </div>

      <p className="help-about-link">
        <button className="help-about-btn" onClick={() => window.open('https://junkoma2.github.io/app-hub/about.html#habit-tracker', '_blank', 'noopener')}>このアプリについて</button>
      </p>
      <p className="help-version">バージョン {__APP_VERSION__}</p>
      <HelpCloseButton />
    </Modal>
  )
}
