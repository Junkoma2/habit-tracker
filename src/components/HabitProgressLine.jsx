import { MILESTONES, getNextMilestone } from '../utils/stats'
import './HabitProgressLine.css'

// 表示するマイルストンを streak に応じて動的に選択する
// - 達成済みの最後のものを含む
// - 未達成のものを最大3件含む
// - 常に最低1件は未達成を含む（全達成なら末尾を表示）
function getDisplayMilestones(streak) {
  const reachedIdx = MILESTONES.reduce((last, m, i) => (streak >= m.days ? i : last), -1)
  // 未達成の先頭インデックス
  const nextIdx = reachedIdx + 1

  // 達成済みは最後の1件だけ表示（先頭なら省く）
  const startIdx = reachedIdx >= 0 ? reachedIdx : 0
  // 未達成は最大3件
  const endIdx = Math.min(nextIdx + 2, MILESTONES.length - 1)

  return MILESTONES.slice(startIdx, endIdx + 1)
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
        {displayMilestones.map((milestone, i) => {
          const reached = streak >= milestone.days
          const isFirst = i === 0
          // 先頭が達成済みで、かつその前に達成済みマイルストンがある場合は「...」を示す
          const showLeadingDots = isFirst && reached && MILESTONES.indexOf(milestone) > 0
          return (
            <div
              key={milestone.days}
              className={`hpl-stage${reached ? ' hpl-stage--reached' : ''}${showLeadingDots ? ' hpl-stage--has-prev' : ''}`}
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
