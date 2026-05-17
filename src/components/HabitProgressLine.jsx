import { MILESTONES, getNextMilestone } from '../utils/stats'
import './HabitProgressLine.css'

const DISPLAY_COUNT = 4

function getDisplayMilestones(streak) {
  const reachedIdx = MILESTONES.reduce((last, m, i) => (streak >= m.days ? i : last), -1)

  const windowNum = reachedIdx < 0 ? 0 : Math.floor(reachedIdx / (DISPLAY_COUNT - 1))
  let startIdx = windowNum * (DISPLAY_COUNT - 1)
  let endIdx = Math.min(startIdx + DISPLAY_COUNT - 1, MILESTONES.length - 1)
  startIdx = Math.max(0, endIdx - DISPLAY_COUNT + 1)

  return {
    milestones: MILESTONES.slice(startIdx, endIdx + 1).map(m => ({
      ...m,
      isReached: streak >= m.days,
    })),
    hasLeftTail: startIdx > 0,
    hasRightTail: endIdx < MILESTONES.length - 1,
  }
}

export default function HabitProgressLine({ habit, streak }) {
  const next = getNextMilestone(streak)
  const allDone = next === null

  const reachedIdx = MILESTONES.reduce((last, m, i) => (streak >= m.days ? i : last), -1)
  const lastReached = reachedIdx >= 0 ? MILESTONES[reachedIdx] : null
  const nextMilestone = reachedIdx >= 0 && reachedIdx < MILESTONES.length - 1 ? MILESTONES[reachedIdx + 1] : null

  const markerPos = lastReached && nextMilestone && streak > lastReached.days
    ? (streak - lastReached.days) / (nextMilestone.days - lastReached.days)
    : null

  const { milestones: displayMilestones, hasLeftTail, hasRightTail } = getDisplayMilestones(streak)

  const trackClasses = [
    'hpl-track',
    hasLeftTail ? 'hpl-track--has-left-tail' : '',
    hasRightTail ? 'hpl-track--has-right-tail' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className="hpl-row">
      <div className="hpl-header">
        <span className="hpl-habit-dot" style={{ backgroundColor: habit.color }} />
        <span className="hpl-habit-name">{habit.name}</span>
        {next ? (
          <span className="hpl-next">あと{next.days - streak}日で{next.label}</span>
        ) : (
          <span className="hpl-next hpl-next--done">全マイルストン達成</span>
        )}
      </div>
      <div
        className={trackClasses}
        style={{ gridTemplateColumns: `repeat(${displayMilestones.length}, 1fr)`, '--col-count': displayMilestones.length }}
      >
        {displayMilestones.map((milestone) => {
          const isMarkerStage = markerPos !== null && nextMilestone && milestone.days === nextMilestone.days
          return (
            <div
              key={milestone.days}
              className={`hpl-stage${milestone.isReached ? ' hpl-stage--reached' : ''}${isMarkerStage ? ' hpl-stage--has-marker' : ''}`}
              style={isMarkerStage ? { '--marker-pos': markerPos } : undefined}
            >
              <div className="hpl-node" />
              <span className="hpl-stage-label">{milestone.label}</span>
            </div>
          )
        })}
      </div>
      {allDone && (
        <div className="hpl-all-done">すべてのマイルストンを達成しました</div>
      )}
    </div>
  )
}
