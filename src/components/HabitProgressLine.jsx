import { MILESTONES, getNextMilestone } from '../utils/stats'
import './HabitProgressLine.css'

// 表示するマイルストン（最初の4件 = 1日・4日・1週間・2週間）
const DISPLAY_MILESTONES = MILESTONES.slice(0, 4)

export default function HabitProgressLine({ habit, streak }) {
  const next = getNextMilestone(streak)

  return (
    <div className="hpl-row">
      <div className="hpl-header">
        <span className="hpl-habit-dot" style={{ backgroundColor: habit.color }} />
        <span className="hpl-habit-name">{habit.name}</span>
        {next && (
          <span className="hpl-next">あと{next.days - streak}日で{next.label}</span>
        )}
      </div>
      <div className="hpl-track">
        {DISPLAY_MILESTONES.map((milestone) => {
          const reached = streak >= milestone.days
          return (
            <div
              key={milestone.days}
              className={`hpl-stage${reached ? ' hpl-stage--reached' : ''}`}
            >
              <div className="hpl-node" />
              <span className="hpl-stage-label">{milestone.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
