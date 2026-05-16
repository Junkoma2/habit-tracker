import './HabitTip.css'

export default function HabitTip({ tip, visible, returning }) {
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
