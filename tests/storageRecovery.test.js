import { describe, expect, it } from 'vitest'
import { CORRUPT_BACKUP_KEY, inspectStoredData, quarantineCorruptData } from '../src/hooks/useHabitsStorage'

function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)) },
  }
}

const KEY = 'habit-tracker-v1'

describe('inspectStoredData', () => {
  it('reads valid data as ok', () => {
    const raw = JSON.stringify({ habits: [{ id: 'h1' }], records: { '2026-05-01': ['h1'] } })
    const r = inspectStoredData(fakeStorage({ [KEY]: raw }))
    expect(r.status).toBe('ok')
    expect(r.data.habits).toHaveLength(1)
    expect(r.data.colorCategories).toEqual({})
  })

  it('treats missing data as empty, not corrupt', () => {
    expect(inspectStoredData(fakeStorage()).status).toBe('empty')
  })

  it.each([
    ['unparsable text', '{broken'],
    ['non-object JSON', '[1,2]'],
    ['null JSON', 'null'],
    ['missing records', JSON.stringify({ habits: [] })],
    ['habits not array', JSON.stringify({ habits: {}, records: {} })],
  ])('flags %s as corrupt and returns the raw string', (_, raw) => {
    const r = inspectStoredData(fakeStorage({ [KEY]: raw }))
    expect(r.status).toBe('corrupt')
    expect(r.raw).toBe(raw)
    expect(r.data).toEqual({ habits: [], records: {}, colorCategories: {} })
  })
})

describe('quarantineCorruptData', () => {
  it('copies the raw string to the backup key', () => {
    const s = fakeStorage({ [KEY]: '{broken' })
    expect(quarantineCorruptData('{broken', s)).toBe(true)
    expect(s.getItem(CORRUPT_BACKUP_KEY)).toBe('{broken')
    expect(s.getItem(KEY)).toBe('{broken')
  })

  it('does not overwrite an existing backup', () => {
    const s = fakeStorage({ [CORRUPT_BACKUP_KEY]: 'first' })
    quarantineCorruptData('second', s)
    expect(s.getItem(CORRUPT_BACKUP_KEY)).toBe('first')
  })

  it('returns false when storage fails', () => {
    const s = { getItem: () => null, setItem: () => { throw new Error('quota') } }
    expect(quarantineCorruptData('x', s)).toBe(false)
  })
})
