import { describe, expect, it } from 'vitest'
import {
  maskAllButLastFour,
  maskReferenceNumbers,
  sampleResponse
} from '../../../app/logger/utils.js'

describe('sampleResponse', () => {
  it('should return null for null input', () => {
    expect(sampleResponse(null)).toBeNull()
  })

  it('should return undefined for undefined input', () => {
    expect(sampleResponse(undefined)).toBeUndefined()
  })

  it('should parse JSON string input', () => {
    const input = '{"name": "test", "values": [1, 2, 3, 4, 5, 6]}'
    const expected = { name: 'test', values: [1, 2, 3, 4, 5] }
    expect(sampleResponse(input)).toEqual(expected)
  })

  it('should return original string if not valid JSON', () => {
    const input = 'not a json string'
    expect(sampleResponse(input)).toBe(input)
  })

  it('should sample arrays to 5 items', () => {
    const input = {
      items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    }
    const expected = {
      items: [1, 2, 3, 4, 5]
    }
    expect(sampleResponse(input)).toEqual(expected)
  })

  it('should keep arrays with 5 or fewer items unchanged', () => {
    const input = {
      items: [1, 2, 3, 4, 5]
    }
    expect(sampleResponse(input)).toEqual(input)
  })

  it('should handle nested objects and arrays', () => {
    const input = {
      name: 'test',
      items: [1, 2, 3, 4, 5, 6],
      nested: {
        values: [7, 8, 9, 10, 11, 12],
        other: 'value'
      }
    }
    const expected = {
      name: 'test',
      items: [1, 2, 3, 4, 5],
      nested: {
        values: [7, 8, 9, 10, 11],
        other: 'value'
      }
    }
    expect(sampleResponse(input)).toEqual(expected)
  })

  it('should not mutate the input object', () => {
    const input = {
      items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    }
    const inputCopy = JSON.parse(JSON.stringify(input))
    sampleResponse(input)
    expect(input).toEqual(inputCopy)
  })
})

describe('maskAllButLastFour', () => {
  it('masks all but the last four characters of a string', () => {
    expect(maskAllButLastFour('9234567890')).toBe('******7890')
  })

  it('leaves a four character string unmasked', () => {
    expect(maskAllButLastFour('1234')).toBe('1234')
  })

  it('leaves a string shorter than four characters unmasked', () => {
    expect(maskAllButLastFour('123')).toBe('123')
  })

  it('returns an empty string unchanged', () => {
    expect(maskAllButLastFour('')).toBe('')
  })

  it('masks a number, returning a string', () => {
    expect(maskAllButLastFour(9234567890)).toBe('******7890')
    expect(maskAllButLastFour(5565448)).toBe('***5448')
  })

  it('leaves a number of four digits or fewer unchanged', () => {
    expect(maskAllButLastFour(1234)).toBe(1234)
  })

  it('returns other non-string values unchanged', () => {
    expect(maskAllButLastFour(null)).toBeNull()
    expect(maskAllButLastFour(undefined)).toBeUndefined()
    expect(maskAllButLastFour({ crn: '9234567890' })).toEqual({ crn: '9234567890' })
  })
})

describe('maskReferenceNumbers', () => {
  it.each([
    [
      'an SBI',
      'organisation not found for SBI 823456789',
      'organisation not found for SBI *****6789'
    ],
    ['a CRN', 'customer 9234567890 not found', 'customer ******7890 not found'],
    ['an orgId', 'organisation ID: 5565448', 'organisation ID: ***5448'],
    ['an 8 digit orgId', 'organisation ID: 55654481', 'organisation ID: ****4481'],
    ['a quoted id', 'dup key: { _id: "823456789" }', 'dup key: { _id: "*****6789" }'],
    ['an id in a path', '/organisation/823456789/details', '/organisation/*****6789/details'],
    ['every id', 'sbis 823456789, 887654321', 'sbis *****6789, *****4321']
  ])('masks %s', (_, text, expected) => {
    expect(maskReferenceNumbers(text)).toBe(expected)
  })

  it.each([
    ['a number shorter than 7 digits', 'port 443, took 123456 ms'],
    ['a longer number (e.g. an epoch ms timestamp)', 'at 1795609233000'],
    ['a decimal', 'took 1.823456789 seconds'],
    ['a number followed by decimals', 'value 823456789.5'],
    ['digits inside an alphanumeric id', 'ref ABC823456789 and 823456789XYZ'],
    ['a UUID whose first segment is all digits', 'trace 12345678-1234-1234-1234-123456789012']
  ])('leaves %s unchanged', (_, text) => {
    expect(maskReferenceNumbers(text)).toBe(text)
  })

  it('returns non-string values unchanged', () => {
    expect(maskReferenceNumbers(823456789)).toBe(823456789)
    expect(maskReferenceNumbers(undefined)).toBeUndefined()
    expect(maskReferenceNumbers(null)).toBeNull()
  })
})
