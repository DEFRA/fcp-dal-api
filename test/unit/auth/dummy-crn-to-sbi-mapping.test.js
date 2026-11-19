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
    expect(() => parseDummyCrnToSbiMapping(value)).toThrow(/DUMMY_DEFRA_ID_CRN_TO_SBI_MAPPING/)
  })

  it.each([
    [
      'entry',
      'abc:810000000,9100000001:810000000',
      'Invalid DUMMY_DEFRA_ID_CRN_TO_SBI_MAPPING entry 1, expected "crn:sbi|sbi"'
    ],
    [
      'SBI',
      '9100000001:810000000,9100000002:810abc',
      'Invalid SBI in DUMMY_DEFRA_ID_CRN_TO_SBI_MAPPING entry 2'
    ],
    [
      'duplicate CRN',
      '9100000001:810000000,9100000001:810000001',
      'Duplicate CRN in DUMMY_DEFRA_ID_CRN_TO_SBI_MAPPING entry 2'
    ]
  ])('identifies an invalid %s by position, without its values', (_, value, message) => {
    expect(() => parseDummyCrnToSbiMapping(value)).toThrow(message)
    expect(() => parseDummyCrnToSbiMapping(value)).not.toThrow(/9100000001|81000000/)
  })
})
