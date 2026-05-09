import { getDailyTip } from '../data/habitTips'
import './HabitTip.css'

export default function HabitTip({ today }) {
  const tip = getDailyTip(today)
  return (
    <div className="habit-tip-card" aria-label="習慣化のヒント">
      <span className="habit-tip-title">習慣化のヒント</span>
      <p className="habit-tip-body">{tip}</p>
    </div>
  )
}
