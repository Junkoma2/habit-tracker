import { describe, expect, it } from 'vitest'
import { formatDate, parseLocalDate, formatDisplayDate } from '../src/utils/date'

describe('formatDate', () => {
  it('月末の日付を正しくフォーマットする', () => {
    expect(formatDate(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('年末を正しくフォーマットする', () => {
    expect(formatDate(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('月を2桁でゼロ埋めする', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('parseLocalDate', () => {
  it('YYYY-MM-DD文字列をローカル日付に変換する', () => {
    const d = parseLocalDate('2026-06-09')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(5) // 0-indexed
    expect(d.getDate()).toBe(9)
  })

  it('月末日を正しく解析する', () => {
    const d = parseLocalDate('2026-01-31')
    expect(d.getDate()).toBe(31)
  })
})

describe('formatDisplayDate', () => {
  it('日本語表示形式に変換する', () => {
    const result = formatDisplayDate('2026-06-09')
    expect(result).toContain('2026年')
    expect(result).toContain('6月')
    expect(result).toContain('9日')
  })
})
