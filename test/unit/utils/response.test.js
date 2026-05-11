import { containsAnyResolvedData } from '../../../app/utils/response.js'

describe('containsAnyResolvedData', () => {
  describe('null and undefined', () => {
    it('returns false for null', () => {
      expect(containsAnyResolvedData(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(containsAnyResolvedData(undefined)).toBe(false)
    })
  })

  describe('primitives', () => {
    it('returns true for a string', () => {
      expect(containsAnyResolvedData('hello')).toBe(true)
    })

    it('returns true for a number', () => {
      expect(containsAnyResolvedData(0)).toBe(true)
    })

    it('returns true for a boolean false', () => {
      expect(containsAnyResolvedData(false)).toBe(true)
    })
  })

  describe('arrays', () => {
    it('returns true for an empty array', () => {
      expect(containsAnyResolvedData([])).toBe(true)
    })

    it('returns true for an array with values', () => {
      expect(containsAnyResolvedData([{ sheetId: 'SJ64' }])).toBe(true)
    })
  })

  describe('objects', () => {
    it('returns false for an object where all leaf values are null', () => {
      expect(containsAnyResolvedData({ agreements: null })).toBe(false)
    })

    it('returns false for a deeply nested object where all leaves are null', () => {
      expect(containsAnyResolvedData({ business: { agreements: null } })).toBe(false)
    })

    it('returns true for an object with at least one non-null leaf value', () => {
      expect(containsAnyResolvedData({ business: { name: 'Farm' } })).toBe(true)
    })

    it('returns true when some fields are null but at least one is not', () => {
      expect(containsAnyResolvedData({ name: 'Farm', agreements: null })).toBe(true)
    })

    it('returns true when a nested field resolves to an empty array', () => {
      expect(containsAnyResolvedData({ business: { agreements: [] } })).toBe(true)
    })
  })
})
