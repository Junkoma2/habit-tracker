import { useState } from 'react'
import { PHASES } from '../utils/habitPhase'
import './StatsPhaseCard.css'

// フェーズのマイルストーン日数（最終の Infinity は除く）
const MILESTONE_DAYS = PHASES.slice(0, -1).map(p => p.days)

// 連続日数がどのステップ（0-indexed）にいるか
function getStepIndex(streak) {
  for (let i = 0; i < MILESTONE_DAYS.length; i++) {
    if (streak < MILESTONE_DAYS[i]) return i
  }
  return MILESTONE_DAYS.length
}

function PhaseSteps({ streak }) {
  const stepIndex = getStepIndex(streak)

  return (
    <div className="phase-steps">
      {MILESTONE_DAYS.map((days, i) => {
        const done = streak >= days
        const current = i === stepIndex
        return (
          <div key={days} className={`phase-step${done ? ' done' : ''}${current ? ' current' : ''}`}>
            <div className="phase-step-dot" />
            <span className="phase-step-label">{days}日</span>
          </div>
        )
      })}
      {/* 最終フェーズ（自動化） */}
      <div className={`phase-step${stepIndex >= MILESTONE_DAYS.length ? ' done' : ''}`}>
        <div className="phase-step-dot" />
        <span className="phase-step-label">定着</span>
      </div>
    </div>
  )
}

export default function StatsPhaseCard({ habitPhases }) {
  const [showInfo, setShowInfo] = useState(false)

  return (
    <section className="section">
      <div className="analysis-subhead">
        <span>習慣化フェーズ</span>
        <button
          className="phase-info-btn"
          onClick={() => setShowInfo(v => !v)}
          aria-label="フェーズ日数の根拠を見る"
          aria-expanded={showInfo}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="8" strokeWidth="2.5" />
            <line x1="12" y1="12" x2="12" y2="16" />
          </svg>
        </button>
      </div>

      {showInfo && (
        <div className="phase-info-panel">
          <p>習慣は繰り返しによって少しずつ自然化すると言われています。</p>
          <p>研究では平均66日前後で自動化が進んだという報告もありますが、個人差があります。</p>
          <p>このアプリでは、小さな継続を段階的に感じられるよう3日・14日・30日・60日などの目安を設定しています。</p>
        </div>
      )}

      <div className="phase-list">
        {habitPhases.map(({ habit, streak, phase }) => (
          <div key={habit.id} className="phase-row">
            <span className="phase-dot" style={{ backgroundColor: habit.color }} />
            <div className="phase-row-main">
              <span className="phase-name">{habit.name}</span>
              <PhaseSteps streak={streak} />
            </div>
            <div className="phase-row-right">
              <span className="phase-tag" style={{ color: habit.color, borderColor: habit.color }}>
                {phase.label}
              </span>
              <span className="phase-streak">{streak}日</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
