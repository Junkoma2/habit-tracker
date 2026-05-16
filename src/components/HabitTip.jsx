import { getDailyTip } from '../data/habitTips'
import './HabitTip.css'

// 深いスワイプ時だけ表示するヒント（常設なし）
export default function HabitTip({ today, visible }) {
  const tip = getDailyTip(today)
  return (
    <div className={`habit-tip-pull${visible ? ' visible' : ''}`} aria-live="polite" aria-atomic="true">
      <p className="habit-tip-pull-body">{tip}</p>
    </div>
  )
}
