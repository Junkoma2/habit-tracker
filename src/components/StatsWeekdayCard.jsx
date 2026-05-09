const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土']

export default function StatsWeekdayCard({ weekdayRates }) {
  return (
    <section className="section">
      <div className="analysis-subhead">
        <span>曜日別達成率</span>
        <small>直近30日</small>
      </div>
      <div className="analysis-weekday-list">
        {weekdayRates.map(item => (
          <div className="analysis-weekday-row" key={item.label}>
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
