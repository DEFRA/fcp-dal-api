import { BadRequest } from '../../../app/errors/graphql.js'
import { validateDate } from '../../../app/utils/date.js'

describe('validateDate function', () => {
  it('should return a Date object for a valid ISO 8601 date string', () => {
    const dateString = '2020-01-01'
    const result = validateDate(dateString)
    expect(result).toBeInstanceOf(Date)
    expect(result.toISOString()).toBe('2020-01-01T00:00:00.000Z')
  })

  it('should throw a BadRequest error for an invalid date string', () => {
    const invalidDateString = 'invalid-date'
    expect(() => validateDate(invalidDateString)).toThrow(BadRequest)
    expect(() => validateDate(invalidDateString)).toThrow(
      'Invalid date format: "invalid-date" is not a valid date. Date should be supplied in ISO 8601 format, e.g. 2020-01-01'
    )
  })
})
