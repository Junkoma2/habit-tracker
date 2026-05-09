export const PHASES = [
  { label: '脱・三日坊主', days: 3, desc: '最初の数日は心理的ハードルが最も高い時期。完璧より「やる感覚」を作ることが大切です。' },
  { label: '継続チャレンジ', days: 14, desc: '同じ行動を繰り返すことで、少しずつ生活リズムに組み込みやすくなる時期です。' },
  { label: 'リズム形成', days: 30, desc: '行動が生活の一部になり始める時期。同じ時間・場所で行うとさらに定着しやすくなります。' },
  { label: '習慣定着', days: 60, desc: '約2か月前後で自然に続けやすくなる傾向があります。ここまで来たら自信を持って。' },
  { label: '自動化', days: Infinity, desc: '行動が「当たり前」になった状態。次の習慣に挑戦するいいタイミングかもしれません。' },
]

export function getPhase(streak) {
  for (let i = 0; i < PHASES.length; i++) {
    if (streak < PHASES[i].days) return { phase: PHASES[i], index: i }
  }
  return { phase: PHASES[PHASES.length - 1], index: PHASES.length - 1 }
}
