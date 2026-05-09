import { getDailyTip } from '../data/habitTips'
import './HabitTip.css'

export default function HabitTip({ today }) {
  const tip = getDailyTip(today)
  return (
    <p className="habit-tip" aria-label="継続のヒント">
      {tip}
    </p>
  )
}
