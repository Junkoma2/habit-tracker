export default function StatsWeekdayCard({ weekdayRates }) {
  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">曜日別達成率</h2>
        <small className="section-sub">直近30日</small>
      </div>
      <div className="analysis-weekday-list">
        {weekdayRates.map(item => (
          <div className={`analysis-weekday-row${item.isToday ? ' analysis-weekday-row--today' : ''}`} key={item.label}>
            <span className="analysis-weekday-label">{item.label}</span>
            <div className="analysis-weekday-bar">
              <span style={{ width: `${item.rate ?? 0}%` }} />
            </div>
            <span className="analysis-weekday-rate">{item.rate !== null ? `${item.rate}%` : '-'}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
