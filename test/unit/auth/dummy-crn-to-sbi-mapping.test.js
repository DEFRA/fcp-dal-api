import { describe, expect, it } from 'vitest'
import { parseDummyCrnToSbiMapping } from '../../../app/auth/dummy-crn-to-sbi-mapping.js'

describe('parseDummyCrnToSbiMapping', () => {
  it.each([null, undefined, '', '  '])('returns an empty map for %j', (value) => {
    expect(parseDummyCrnToSbiMapping(value)).toEqual(new Map())
  })

  it('parses a single mapping', () => {
    expect(parseDummyCrnToSbiMapping('9100000001:810000000')).toEqual(
      new Map([['9100000001', new Set(['810000000'])]])
    )
  })

  it('parses several mappings, trimming whitespace', () => {
    expect(
      parseDummyCrnToSbiMapping(' 9100000001 : 810000000 | 810000001 , 9100000002:810000002 ')
    ).toEqual(
      new Map([
        ['9100000001', new Set(['810000000', '810000001'])],
        ['9100000002', new Set(['810000002'])]
      ])
    )
  })

  it.each([
    ['a missing SBI list', '9100000001'],
    ['an empty SBI list', '9100000001:'],
    ['an empty SBI', '9100000001:810000000||810000001'],
    ['a non-digit CRN', 'abc:810000000'],
    ['a non-digit SBI', '9100000001:810abc'],
    ['too many parts', '9100000001:9100000003:810000000'],
    ['an empty entry', '9100000001:810000000,']
  ])('rejects %s', (_, value) => {
    expect(() => parseDummyCrnToSbiMapping(value)).toThrow(/dummy Defra ID CRN to SBI mapping/)
  })

  it('rejects a duplicate CRN', () => {
    expect(() => parseDummyCrnToSbiMapping('9100000001:810000000,9100000001:810000001')).toThrow(
      'Duplicate CRN in dummy Defra ID CRN to SBI mapping: "9100000001"'
    )
  })
})
