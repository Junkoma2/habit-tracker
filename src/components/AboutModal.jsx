import { useState } from 'react'
import Modal from './Modal'
import './AboutModal.css'

export default function AboutModal({ onClose }) {
  return (
    <Modal onClose={onClose} title="このアプリについて">
      <div className="about-content">
        <section className="about-section">
          <h3 className="about-heading">作った理由</h3>
          <p>
            習慣を記録するアプリはたくさんあります。でも、使っていくうちに「疲れる」アプリが多いと感じていました。
            グラフが増える、ストリークが切れると通知が来る、達成できない日が続くと画面を開きたくなくなる。
          </p>
          <p>
            このアプリは、そういう疲れを感じずに使えるものを目指して作りました。
            記録できた日を静かに残す。それだけでいい、という考え方です。
          </p>
        </section>

        <section className="about-section">
          <h3 className="about-heading">大切にしていること</h3>
          <p>
            「続けること」より「戻ってこられること」を大事にしています。
            数日できなかったとしても、また今日から再開できればそれで十分です。
            アプリが責めたり、焦らせたりすることは一切ありません。
          </p>
          <p>
            機能は少ないほうがいいと思っています。何でもできるより、毎日開いても飽きない、疲れない道具であることを優先しました。
          </p>
        </section>

        <section className="about-section">
          <h3 className="about-heading">機能の紹介</h3>
          <p>
            続けたい習慣を登録して、できた日にタップするだけです。
            ホーム画面のカレンダーで、どの日に何ができたかを一目で振り返られます。
            日付をタップするとその日の記録が開き、前日分は長押しで遡って記録することもできます。
          </p>
          <p>
            分析画面では、直近の達成率や曜日ごとの傾向を確認できます。
            完璧な記録を目指すためではなく、「次にどう続けるか」を自分なりに考えるための画面です。
          </p>
          <p>
            習慣を「終了」にしても、それまでの記録はすべて残ります。
            新しく習慣を追加しても、過去の達成率は変わりません。
          </p>
        </section>

        <section className="about-section">
          <h3 className="about-heading">データについて</h3>
          <p>
            記録はすべてこの端末のブラウザ内に保存されます。サーバーには送られません。
            アカウント登録も不要です。
          </p>
          <p>
            端末を変えるときや、バックアップを取りたいときは、設定画面からデータをファイルに書き出せます。
            同じ画面から読み込むことで、別の端末でも続きを使えます。
          </p>
        </section>

        <section className="about-section">
          <h3 className="about-heading">作った人</h3>
          <p>
            個人で作っています。感想や気になることがあれば{' '}
            <a href="mailto:sharon0630@icloud.com" className="about-link">sharon0630@icloud.com</a>{' '}
            までどうぞ。
          </p>
        </section>
      </div>
    </Modal>
  )
}
