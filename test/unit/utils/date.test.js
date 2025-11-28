import { BadRequest } from '../../../app/errors/graphql.js'
import { validateDateInput, validatePastDateInput } from '../../../app/utils/date.js'

describe('validateDateInput function', () => {
  it('should return a Date object for a valid ISO 8601 date string', () => {
    const dateString = '2020-01-01'
    const result = validateDateInput(dateString)
    expect(result).toBeInstanceOf(Date)
    expect(result.toISOString()).toBe('2020-01-01T00:00:00.000Z')
  })

  it('should throw a BadRequest error for an invalid date string', () => {
    const invalidDateString = 'invalid-date'
    expect(() => validateDateInput(invalidDateString)).toThrow(BadRequest)
    expect(() => validateDateInput(invalidDateString)).toThrow(
      'Invalid date format: "invalid-date" is not a valid date. ' +
        'Date should be supplied in ISO 8601 format, e.g. 2020-01-01'
    )
  })
})

describe('validatePastDateInput function', () => {
  it('should return a Date object for a valid ISO 8601 date string in the past', () => {
    const dateString = '2020-01-01'
    const result = validatePastDateInput(dateString)
    expect(result).toBeInstanceOf(Date)
    expect(result.toISOString()).toBe('2020-01-01T00:00:00.000Z')
  })

  it('should throw a BadRequest error for a valid FUTURE date string', () => {
    const invalidDateString = new Date('9999-12-31T23:59:59.999Z').toISOString()
    expect(() => validatePastDateInput(invalidDateString)).toThrow(BadRequest)
    expect(() => validatePastDateInput(invalidDateString)).toThrow(
      'Invalid date: "9999-12-31T23:59:59.999Z" must be in the past.'
    )
  })
})
