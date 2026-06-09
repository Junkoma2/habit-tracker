import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { calcCurrentStreak, calcStats, getNextMilestone, MILESTONES } from '../src/utils/stats'

// calcCurrentStreak は new Date() に依存するためモックが必要
const TODAY = '2026-06-09'

function makeRecords(dates, habitId = 'h_1') {
  return Object.fromEntries(dates.map(d => [d, [habitId]]))
}

describe('calcCurrentStreak', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-09'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('今日未達で昨日から連続している場合はストリークを返す', () => {
    const records = makeRecords(['2026-06-07', '2026-06-08'])
    expect(calcCurrentStreak('h_1', records)).toBe(2)
  })

  it('今日達成していてストリークが続く', () => {
    const records = makeRecords(['2026-06-08', '2026-06-09'])
    expect(calcCurrentStreak('h_1', records)).toBe(2)
  })

  it('連続記録なし（昨日も今日も未達）はゼロを返す', () => {
    const records = makeRecords(['2026-06-05'])
    expect(calcCurrentStreak('h_1', records)).toBe(0)
  })

  it('記録が空の場合はゼロを返す', () => {
    expect(calcCurrentStreak('h_1', {})).toBe(0)
  })
})

describe('getNextMilestone', () => {
  it('streak=0のとき最初のマイルストン(1日目)を返す', () => {
    expect(getNextMilestone(0)).toEqual(MILESTONES[0])
  })

  it('streak=7のとき次のマイルストン(21日目)を返す', () => {
    const next = getNextMilestone(7)
    expect(next?.days).toBe(21)
  })

  it('streak=365以上のときnullを返す（全達成）', () => {
    expect(getNextMilestone(365)).toBeNull()
  })
})

describe('calcStats', () => {
  it('記録なしは全てゼロ', () => {
    expect(calcStats('h_1', {})).toEqual({ current: 0, longest: 0, total: 0 })
  })

  it('最長ストリークが正しく計算される', () => {
    beforeEach(() => vi.useFakeTimers())
    const records = makeRecords(['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-05', '2026-06-06'])
    const stats = calcStats('h_1', records)
    expect(stats.longest).toBe(3)
    expect(stats.total).toBe(5)
  })
})
