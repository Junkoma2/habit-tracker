import { MILESTONES, getNextMilestone } from '../utils/stats'
import './HabitProgressLine.css'

// 表示ノードを streak に応じて動的に組み立てる
// 構成: [達成済み最後] → [今ここ] → [未達成1] → [未達成2]
// streak がマイルストンにぴったり当たる場合は そのノードを「今ここ」として扱う
function getDisplayMilestones(streak) {
  const reachedIdx = MILESTONES.reduce((last, m, i) => (streak >= m.days ? i : last), -1)
  const nextIdx = reachedIdx + 1

  // streak = 0: まだ開始前、未達成を3件表示
  if (streak === 0) {
    return MILESTONES.slice(0, 3).map(m => ({ ...m, isReached: false, isCurrent: false }))
  }

  // streak がちょうどマイルストンに一致する場合、そのノードを今こことして扱う
  const exactHit = reachedIdx >= 0 && MILESTONES[reachedIdx].days === streak

  const nodes = []

  // 達成済み最後（exactHit でない場合のみ）
  if (reachedIdx >= 0 && !exactHit) {
    nodes.push({ ...MILESTONES[reachedIdx], isReached: true, isCurrent: false })
  }

  // 今ここノード
  if (exactHit) {
    nodes.push({ ...MILESTONES[reachedIdx], isReached: true, isCurrent: true })
  } else {
    nodes.push({ days: streak, label: '今ここ', isReached: false, isCurrent: true })
  }

  // 未達成を2件（全達成なら追加しない）
  MILESTONES.slice(nextIdx, nextIdx + 2).forEach(m => {
    nodes.push({ ...m, isReached: false, isCurrent: false })
  })

  return nodes
}

export default function HabitProgressLine({ habit, streak }) {
  const next = getNextMilestone(streak)
  const displayMilestones = getDisplayMilestones(streak)
  const allDone = next === null

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
          const classes = [
            'hpl-stage',
            milestone.isReached ? 'hpl-stage--reached' : '',
            milestone.isCurrent ? 'hpl-stage--current' : '',
          ].filter(Boolean).join(' ')
          return (
            <div key={`${milestone.days}-${milestone.isCurrent}`} className={classes}>
              <div className="hpl-node" />
              {milestone.isCurrent && !milestone.isReached ? (
                <span className="hpl-stage-label">
                  {streak}日<br />今ここ
                </span>
              ) : (
                <span className="hpl-stage-label">{milestone.label}</span>
              )}
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
