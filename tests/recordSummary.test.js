import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { buildHabitRecordSummaries } from '../src/utils/recordSummary'

describe('buildHabitRecordSummaries', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-09'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('累計達成数と現在の連続日数を別々に返す', () => {
    const habits = [{ id: 'h_1', name: 'Water', color: '#38bdf8' }]
    const records = {
      '2026-06-01': ['h_1'],
      '2026-06-02': ['h_1'],
      '2026-06-03': ['h_1'],
      '2026-06-08': ['h_1'],
    }

    const [summary] = buildHabitRecordSummaries(habits, records)

    expect(summary.streak).toBe(1)
    expect(summary.total).toBe(4)
  })
})
