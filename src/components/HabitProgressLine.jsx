import { MILESTONES, getNextMilestone } from '../utils/stats'
import './HabitProgressLine.css'

const DISPLAY_COUNT = 4

// ウィンドウを段階的に固定し、達成が増えると左から右へ丸が塗りつぶされる
// DISPLAY_COUNT-1 個ごとにウィンドウが切り替わる
function getDisplayMilestones(streak) {
  const reachedIdx = MILESTONES.reduce((last, m, i) => (streak >= m.days ? i : last), -1)

  const windowNum = reachedIdx < 0 ? 0 : Math.floor(reachedIdx / (DISPLAY_COUNT - 1))
  let startIdx = windowNum * (DISPLAY_COUNT - 1)
  let endIdx = Math.min(startIdx + DISPLAY_COUNT - 1, MILESTONES.length - 1)
  startIdx = Math.max(0, endIdx - DISPLAY_COUNT + 1)

  return MILESTONES.slice(startIdx, endIdx + 1).map(m => ({
    ...m,
    isReached: streak >= m.days,
  }))
}

export default function HabitProgressLine({ habit, streak }) {
  const next = getNextMilestone(streak)
  const allDone = next === null

  const reachedIdx = MILESTONES.reduce((last, m, i) => (streak >= m.days ? i : last), -1)
  const lastReached = reachedIdx >= 0 ? MILESTONES[reachedIdx] : null
  const nextMilestone = reachedIdx >= 0 && reachedIdx < MILESTONES.length - 1 ? MILESTONES[reachedIdx + 1] : null

  // 今ここマーカーの位置（0〜1）：ちょうど達成した瞬間はマーカーなし
  const markerPos = lastReached && nextMilestone && streak > lastReached.days
    ? (streak - lastReached.days) / (nextMilestone.days - lastReached.days)
    : null

  const displayMilestones = getDisplayMilestones(streak)

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
      <div className="hpl-track" style={{ gridTemplateColumns: `repeat(${displayMilestones.length}, 1fr)` }}>
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
