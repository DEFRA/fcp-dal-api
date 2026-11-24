import { describe, expect, it } from 'vitest'
import { RawJSON, stringifyWithRawJSON } from '../../../app/utils/raw-json.js'

describe('stringifyWithRawJSON', () => {
  it('stringifies values without RawJSON like JSON.stringify', () => {
    const value = { data: { a: 1, b: ['x', null, true], c: 'quote " and \\ backslash' } }
    expect(stringifyWithRawJSON(value)).toBe(JSON.stringify(value))
  })

  it('returns undefined for undefined, like JSON.stringify', () => {
    expect(stringifyWithRawJSON(undefined)).toBeUndefined()
  })

  it('writes RawJSON text into the output verbatim', () => {
    const value = {
      data: [
        { type: 'Polygon', coordinates: new RawJSON('[[[1.5,2],[3,4.25]]]') },
        { type: 'Point', coordinates: new RawJSON('[ 10 , 20 ]') }
      ]
    }

    expect(stringifyWithRawJSON(value)).toBe(
      '{"data":[{"type":"Polygon","coordinates":[[[1.5,2],[3,4.25]]]},' +
        '{"type":"Point","coordinates":[ 10 , 20 ]}]}'
    )
  })

  it('does not replace strings that look like placeholders', () => {
    const lookalike = '\u0000raw-json-00000000-0000-0000-0000-000000000000:0'
    const output = stringifyWithRawJSON({ a: lookalike, b: new RawJSON('[1]') })

    expect(JSON.parse(output)).toEqual({ a: lookalike, b: [1] })
  })

  it('supports nested calls, e.g. from within a toJSON', () => {
    const inner = { toJSON: () => stringifyWithRawJSON({ c: new RawJSON('[2]') }) }
    const output = stringifyWithRawJSON({ a: new RawJSON('[1]'), b: inner })

    expect(JSON.parse(output)).toEqual({ a: [1], b: '{"c":[2]}' })
  })
})

describe('RawJSON', () => {
  it('serialises as its parsed value outside stringifyWithRawJSON', () => {
    expect(JSON.stringify({ c: new RawJSON('[ [1, 2] ]') })).toBe('{"c":[[1,2]]}')
  })
})
