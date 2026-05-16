import { getDailyTip } from '../data/habitTips'
import './HabitTip.css'

export default function HabitTip({ today, visible, returning }) {
  const tip = getDailyTip(today)
  const cls = [
    'habit-tip-pull',
    visible ? 'visible' : '',
    returning ? 'returning' : '',
  ].filter(Boolean).join(' ')
  return (
    <div className={cls} aria-live="polite" aria-atomic="true">
      <p className="habit-tip-pull-body">{tip}</p>
    </div>
  )
}
