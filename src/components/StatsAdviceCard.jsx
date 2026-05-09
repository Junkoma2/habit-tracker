// 達成率に基づく傾向コメント（#195: 評価ではなく支援寄りのトーン）
function getAdvice(rate7) {
  if (rate7 === null) {
    return '記録が増えると、傾向がここに表示されます。'
  }
  if (rate7 >= 80) {
    return '安定したペースで続けられています。'
  }
  if (rate7 >= 50) {
    return '半分以上できています。今の調子を大切に。'
  }
  return '無理のないペースで続けることが、長続きにつながりやすいです。'
}

export default function StatsAdviceCard({ rate7, rate30 }) {
  const advice = getAdvice(rate7)

  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">達成率</h2>
      </div>
      <div className="analysis-advice">
        <span className="analysis-advice-label">直近7日の傾向</span>
        <p>{advice}</p>
      </div>
      <div className="analysis-rate-grid">
        <div className="analysis-rate-card">
          <span className="analysis-rate-value">{rate7 ?? '-'}</span>
          {rate7 !== null && <span className="analysis-rate-unit">%</span>}
          <span className="analysis-rate-label">直近7日</span>
        </div>
        <div className="analysis-rate-card">
          <span className="analysis-rate-value">{rate30 ?? '-'}</span>
          {rate30 !== null && <span className="analysis-rate-unit">%</span>}
          <span className="analysis-rate-label">直近30日</span>
        </div>
      </div>
    </section>
  )
}
