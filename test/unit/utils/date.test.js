import { BadRequest } from '../../../app/errors/graphql.js'
import {
  validateDateInput,
  validatePastDateInput,
  validateUpstreamDate,
  validateUpstreamTimestamp,
  validateUpstreamTimestampToISO
} from '../../../app/utils/date.js'

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

describe('validateUpstreamTimestamp function', () => {
  it('should return a Date object for date-like data', () => {
    expect(validateUpstreamTimestamp(12345678)).toEqual(new Date(12345678))
    expect(validateUpstreamTimestamp('2020-01-01')).toEqual(new Date('2020-01-01'))
    const spaceNoTZ = '2020-01-01 12:12:12' // space, not T as date/time separator, no TZ
    expect(validateUpstreamTimestamp(spaceNoTZ)).toEqual(new Date(spaceNoTZ))
    const MMXX = '2020-01-01T13:46:58.954Z'
    expect(validateUpstreamTimestamp(MMXX)).toEqual(new Date(MMXX))
    // java date format with colon : separating (milli)seconds
    expect(validateUpstreamTimestamp('2020-12-31T04:10:03:123+0100')).toEqual(
      new Date('2020-12-31T04:10:03.123+0100')
    )
  })

  it('should otherwise return null', () => {
    expect(validateUpstreamTimestamp('invalid-date')).toEqual(null)
    expect(validateUpstreamTimestamp(null)).toEqual(null)
    expect(validateUpstreamTimestamp('')).toEqual(null)
    expect(validateUpstreamTimestamp('0-0-0')).toEqual(null)
    expect(validateUpstreamTimestamp('2020-01-01 12:61:12')).toEqual(null) // invalid minute
    expect(validateUpstreamTimestamp('12345678')).toEqual(null)
    expect(validateUpstreamTimestamp()).toEqual(null)
    expect(validateUpstreamTimestamp('2020-31-01')).toEqual(null)
    // unless it's the 30th of February! ☣️ or any other day overflow which is apparently valid 🤷‍♂️
    const feb30th = '2020-02-30T13:46:58.954Z'
    expect(validateUpstreamTimestamp(feb30th)).toEqual(new Date(feb30th))
  })
})

describe('validateUpstreamTimestampToISO function', () => {
  it('should return a Date object for date-like data', () => {
    expect(validateUpstreamTimestampToISO(12345678)).toEqual(new Date(12345678).toISOString())
    expect(validateUpstreamTimestampToISO('2020-01-01')).toEqual(
      new Date('2020-01-01').toISOString()
    )
    const spaceNoTZ = '2020-01-01 12:12:12' // space, not T as date/time separator, no TZ
    expect(validateUpstreamTimestampToISO(spaceNoTZ)).toEqual(new Date(spaceNoTZ).toISOString())
    const MMXX = '2020-01-01T13:46:58.954Z'
    expect(validateUpstreamTimestampToISO(MMXX)).toEqual(new Date(MMXX).toISOString())
    // java date format with colon : separating (milli)seconds
    expect(validateUpstreamTimestampToISO('2020-12-31T04:10:03:123+0100')).toEqual(
      new Date('2020-12-31T04:10:03.123+0100').toISOString()
    )
  })

  it('should otherwise return null', () => {
    expect(validateUpstreamTimestampToISO('invalid-date')).toEqual(null)
    expect(validateUpstreamTimestampToISO(null)).toEqual(null)
    expect(validateUpstreamTimestampToISO('')).toEqual(null)
    expect(validateUpstreamTimestampToISO('0-0-0')).toEqual(null)
    expect(validateUpstreamTimestampToISO('2020-01-01 12:61:12')).toEqual(null) // invalid minute
    expect(validateUpstreamTimestampToISO('12345678')).toEqual(null)
    expect(validateUpstreamTimestampToISO()).toEqual(null)
    expect(validateUpstreamTimestampToISO('2020-31-01')).toEqual(null)
    // unless it's the 30th of February! ☣️ or any other day overflow which is apparently valid 🤷‍♂️
    const feb30th = '2020-02-30T13:46:58.954Z'
    expect(validateUpstreamTimestampToISO(feb30th)).toEqual(new Date(feb30th).toISOString())
  })
})

describe('validateUpstreamDate function', () => {
  it('should return a Date object for date-like data', () => {
    expect(validateUpstreamDate('1970-01-01T00:00:12.345Z')).toEqual('1970-01-01')
    expect(validateUpstreamDate(12345678)).toEqual('1970-01-01') // equivalent to the above
    expect(validateUpstreamDate('2020-01-01')).toEqual('2020-01-01')
    // space, not T as date/time separator, no TZ
    expect(validateUpstreamDate('2020-01-01 12:12:12')).toEqual('2020-01-01')
    expect(validateUpstreamDate('2020-01-01T13:46:58.954Z')).toEqual('2020-01-01')
    // java date format with colon : separating (milli)seconds
    expect(validateUpstreamDate('2020-12-31T00:00:00:000+0100')).toEqual('2020-12-30')
  })

  it('should otherwise return null', () => {
    expect(validateUpstreamDate('invalid-date')).toEqual(null)
    expect(validateUpstreamDate(null)).toEqual(null)
    expect(validateUpstreamDate('')).toEqual(null)
    expect(validateUpstreamDate('0-0-0')).toEqual(null)
    expect(validateUpstreamDate('30/30/30')).toEqual(null)
    expect(validateUpstreamDate('12345678')).toEqual(null)
    expect(validateUpstreamDate()).toEqual(null)
    expect(validateUpstreamDate('2020-31-01')).toEqual(null)
    // unless it's the 30th of February! ☣️ or any other day overflow which is apparently valid 🤷‍♂️
    expect(validateUpstreamDate('2020-02-30T13:46:58.954Z')).toEqual('2020-03-01')
  })
})
