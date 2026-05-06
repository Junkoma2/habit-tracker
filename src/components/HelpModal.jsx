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
    ],
    tags: ['記録'],
  },
  {
    title: 'カレンダーで振り返る',
    body: [
      '続けた日が並ぶと、「積み上がっている実感」が生まれます。',
      '達成状況はカレンダーで確認できます。',
    ],
    tags: ['カレンダー'],
  },
  {
    title: '分析を見る',
    body: [
      '達成率や連続日数など、習慣の流れを確認できます。',
      '完璧を目指すより、「続いていること」を見るための機能です。',
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
    tags: ['記録', 'カレンダー', '分析'],
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
            このアプリは、「無理なく続けること」を大切にして作られています。
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

      <p className="help-version">バージョン {__APP_VERSION__}</p>
      <HelpCloseButton />
    </Modal>
  )
}
