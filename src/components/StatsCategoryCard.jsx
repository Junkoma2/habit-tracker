export default function StatsCategoryCard({ colorStats }) {
  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">色別達成率</h2>
        <small className="section-sub">直近30日</small>
      </div>
      {colorStats.length === 0 ? (
        <p className="analysis-note">カテゴリが設定された色の習慣がありません。</p>
      ) : (
        <div className="analysis-color-list">
          {colorStats.map(({ color, name, count, rate }) => (
            <div className="analysis-color-row" key={color}>
              <span className="analysis-color-dot" style={{ backgroundColor: color }} />
              <span className="analysis-color-label">
                <span className="analysis-color-name">{name}</span>
                <span className="analysis-color-count">{count}件</span>
              </span>
              <div className="analysis-weekday-bar">
                <span style={{ width: `${rate ?? 0}%` }} />
              </div>
              <span className="analysis-color-rate">{rate !== null ? `${rate}%` : '-'}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
