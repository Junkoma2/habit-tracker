import { calcCurrentStreak, calcStats } from './stats'

export function buildHabitRecordSummaries(habits, records) {
  return habits
    .filter(habit => !habit.archivedAt)
    .map(habit => ({
      habit,
      streak: calcCurrentStreak(habit.id, records),
      total: calcStats(habit.id, records).total,
    }))
    .sort((a, b) => b.streak - a.streak)
}
