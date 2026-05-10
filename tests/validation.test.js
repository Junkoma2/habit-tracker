import { describe, expect, it } from 'vitest'
import { sanitizeImportData, validateImportData } from '../src/utils/validation'

const validBackup = {
  habits: [
    {
      id: 'h_1',
      name: '読書',
      color: '#6366F1',
      createdAt: '2026-05-01',
      archivedAt: null,
    },
  ],
  records: {
    '2026-05-01': ['h_1'],
  },
}

describe('validateImportData', () => {
  it('accepts a valid backup shape', () => {
    expect(validateImportData(validBackup)).toBeNull()
  })

  it('rejects invalid date keys', () => {
    expect(validateImportData({
      ...validBackup,
      records: { '2026-02-31': ['h_1'] },
    })).toContain('存在しない日付')
  })

  it('rejects duplicate habit ids', () => {
    expect(validateImportData({
      ...validBackup,
      habits: [...validBackup.habits, { ...validBackup.habits[0], name: '散歩' }],
    })).toContain('重複')
  })
})

describe('sanitizeImportData', () => {
  it('drops records for unknown habit ids', () => {
    const result = sanitizeImportData({
      ...validBackup,
      records: {
        '2026-05-01': ['h_1', 'missing'],
      },
    })

    expect(result.skippedUnknownRecords).toBe(1)
    expect(result.data.records).toEqual({ '2026-05-01': ['h_1'] })
  })
})
