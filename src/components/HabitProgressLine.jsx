import './HabitProgressLine.css'

const STAGES = [
  { label: '脱3日坊主', minDays: 4 },
  { label: '1週間継続', minDays: 8 },
  { label: '定着期', minDays: 22 },
  { label: '安定期', minDays: 67 },
]

export default function HabitProgressLine({ habit, streak }) {
  const nextStage = STAGES.find(s => streak < s.minDays)

  return (
    <div className="hpl-row">
      <div className="hpl-header">
        <span className="hpl-habit-dot" style={{ backgroundColor: habit.color }} />
        <span className="hpl-habit-name">{habit.name}</span>
        {nextStage && (
          <span className="hpl-next">NEXT：{nextStage.label}まであと{nextStage.minDays - streak}日</span>
        )}
      </div>
      <div className="hpl-track">
        {STAGES.map((stage, i) => {
          const reached = streak >= stage.minDays
          return (
            <div
              key={stage.label}
              className={`hpl-stage${reached ? ' hpl-stage--reached' : ''}`}
            >
              <div className="hpl-node" />
              <span className="hpl-stage-label">{stage.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
