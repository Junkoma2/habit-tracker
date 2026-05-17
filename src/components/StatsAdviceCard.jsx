// 達成率に基づく傾向コメント（#195: 評価ではなく支援寄りのトーン）
function getAdvice(rate7) {
  if (rate7 === null) return null
  if (rate7 >= 80) return 'この7日間、安定したペースです。'
  if (rate7 >= 50) return 'この7日間は半分以上できています。'
  return '続けやすい日や時間帯を探してみるのもよいかもしれません。'
}

// statsStartDate がある場合、ラベルを実態に合わせて調整する
function getRangeLabel(days, statsStartDate) {
  if (!statsStartDate) return `直近${days}日`
  return `直近${days}日（開始日以降）`
}

export default function StatsAdviceCard({ rate7, rate30, statsStartDate = null, achieved7 = null, total7 = null, achieved30 = null, total30 = null }) {
  const advice = getAdvice(rate7)

  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">達成率</h2>
      </div>
      <div className="analysis-rate-grid">
        <div className="analysis-rate-card">
          <span className="analysis-rate-value">{rate7 ?? '-'}</span>
          {rate7 !== null && <span className="analysis-rate-unit">%</span>}
          <span className="analysis-rate-label">{getRangeLabel(7, statsStartDate)}</span>
          {total7 > 0 && (
            <span className="analysis-rate-count">{achieved7} / {total7} 回</span>
          )}
        </div>
        <div className="analysis-rate-card">
          <span className="analysis-rate-value">{rate30 ?? '-'}</span>
          {rate30 !== null && <span className="analysis-rate-unit">%</span>}
          <span className="analysis-rate-label">{getRangeLabel(30, statsStartDate)}</span>
          {total30 > 0 && (
            <span className="analysis-rate-count">{achieved30} / {total30} 回</span>
          )}
        </div>
      </div>
      {advice && <p className="analysis-advice-note">{advice}</p>}
    </section>
  )
}
