import { sampleResponse } from '../../../app/logger/utils.js'

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
