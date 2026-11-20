import { describe, expect, it } from 'vitest'
import { Kind } from 'graphql'
import {
  Date as DateScalar,
  SwiftCode,
  UkAccountNumber,
  UkSortCode
} from '../../../../app/graphql/resolvers/scalars.js'

const stringLiteral = (value) => ({ kind: Kind.STRING, value })
const intLiteral = (value) => ({ kind: Kind.INT, value: `${value}` })

describe('UkAccountNumber scalar', () => {
  it.each(['12345678', '00000000'])('accepts %s', (value) => {
    expect(UkAccountNumber.parseValue(value)).toBe(value)
    expect(UkAccountNumber.parseLiteral(stringLiteral(value))).toBe(value)
  })

  const invalid = ['1234567', '123456789', 'abcdefgh', '1234 5678', '', null, 12345678] // sfd-id-check: allow

  it.each(invalid)('rejects %s', (value) => {
    expect(() => UkAccountNumber.parseValue(value)).toThrow(
      'UkAccountNumber must be exactly 8 digits'
    )
  })

  it('rejects non-string literals', () => {
    expect(() => UkAccountNumber.parseLiteral(intLiteral(12345678))).toThrow()
  })

  it('serializes the value through unchanged', () => {
    expect(UkAccountNumber.serialize('12345678')).toBe('12345678')
  })
})

describe('UkSortCode scalar', () => {
  it('accepts a 6-digit string', () => {
    expect(UkSortCode.parseValue('123456')).toBe('123456')
    expect(UkSortCode.parseLiteral(stringLiteral('123456'))).toBe('123456')
  })

  it.each(['12345', '1234567', '12-34-56', 'abcdef'])('rejects %s', (value) => {
    expect(() => UkSortCode.parseValue(value)).toThrow('UkSortCode must be exactly 6 digits')
    expect(() => UkSortCode.parseLiteral(stringLiteral(value))).toThrow(
      'UkSortCode must be exactly 6 digits'
    )
  })

  it('rejects non-string literals', () => {
    expect(() => UkSortCode.parseLiteral(intLiteral(123456))).toThrow(
      'UkSortCode must be exactly 6 digits'
    )
  })

  it('serializes the value through unchanged', () => {
    expect(UkSortCode.serialize('123456')).toBe('123456')
  })
})

describe('SwiftCode scalar', () => {
  it.each(['BARCGB22', 'BARCGB22XXX'])('accepts %s', (value) => {
    expect(SwiftCode.parseValue(value)).toBe(value)
    expect(SwiftCode.parseLiteral(stringLiteral(value))).toBe(value)
  })

  it.each(['BARCGB2', 'BARCGB22XX', 'barcgb22', 'BARCGB22X', ''])('rejects %s', (value) => {
    expect(() => SwiftCode.parseValue(value)).toThrow(
      'SwiftCode must be 8 or 11 uppercase alphanumeric characters'
    )
    expect(() => SwiftCode.parseLiteral(stringLiteral(value))).toThrow(
      'SwiftCode must be 8 or 11 uppercase alphanumeric characters'
    )
  })

  it('rejects non-string literals', () => {
    expect(() => SwiftCode.parseLiteral(intLiteral(12345678))).toThrow(
      'SwiftCode must be 8 or 11 uppercase alphanumeric characters'
    )
  })

  it('serializes the value through unchanged', () => {
    expect(SwiftCode.serialize('BARCGB22XXX')).toBe('BARCGB22XXX')
  })
})

describe('Date scalar', () => {
  const invalidDateMessage = (value) =>
    `Invalid date format: "${value}" is not a valid date. Date should be supplied in ISO 8601 format, e.g. 2020-01-01`

  // Lenient on purpose: anything `new Date()` parses is accepted, to avoid breaking clients
  it.each([
    ['2020-01-01', '2020-01-01T00:00:00.000Z'],
    ['2020-01-01T00:00:00.000Z', '2020-01-01T00:00:00.000Z'],
    ['2020-01-01T01:00:00+01:00', '2020-01-01T00:00:00.000Z']
  ])('parses %s into a Date', (value, expected) => {
    expect(DateScalar.parseValue(value)).toEqual(new Date(expected))
    expect(DateScalar.parseLiteral(stringLiteral(value))).toEqual(new Date(expected))
  })

  // Non-ISO formats are read in local time, so compare with what `new Date()` gives
  it('parses a non-ISO date the same way as new Date()', () => {
    expect(DateScalar.parseValue('01-01-2020')).toEqual(new Date('01-01-2020'))
    expect(DateScalar.parseLiteral(stringLiteral('01-01-2020'))).toEqual(new Date('01-01-2020'))
  })

  it('parses epoch milliseconds into a Date', () => {
    expect(DateScalar.parseValue(1577836800000)).toEqual(new Date('2020-01-01T00:00:00.000Z'))
    expect(DateScalar.parseLiteral(intLiteral(1577836800000))).toEqual(
      new Date('2020-01-01T00:00:00.000Z')
    )
  })

  it('returns a copy of a Date object passed in-process', () => {
    const date = new Date('2021-05-27T12:46:17.305Z')
    const parsed = DateScalar.parseValue(date)
    expect(parsed).toEqual(date)
    expect(parsed).not.toBe(date)
  })

  it('rejects an invalid Date object', () => {
    expect(() => DateScalar.parseValue(new Date('not-a-date'))).toThrow('is not a valid date')
  })

  // "" is not treated as "not supplied": a null result would get past a Date! argument
  it.each(['not-a-date', '', ' ', '2020-13-01'])('rejects %s', (value) => {
    expect(() => DateScalar.parseValue(value)).toThrow(invalidDateMessage(value))
    expect(() => DateScalar.parseLiteral(stringLiteral(value))).toThrow(invalidDateMessage(value))
  })

  it('rejects an invalid date with a BAD REQUEST code', () => {
    expect(() => DateScalar.parseValue('not-a-date')).toThrow(
      expect.objectContaining({ extensions: expect.objectContaining({ code: 'BAD REQUEST' }) })
    )
  })

  it.each([true, null, {}, []])('rejects a non-string value %s', (value) => {
    expect(() => DateScalar.parseValue(value)).toThrow(
      'Date must be a string, ideally in ISO 8601 format, e.g. 2020-01-01'
    )
  })

  it('rejects other literal kinds', () => {
    expect(() => DateScalar.parseLiteral({ kind: Kind.BOOLEAN, value: true })).toThrow(
      'Date must be a string, ideally in ISO 8601 format, e.g. 2020-01-01'
    )
  })

  it('serializes the value through unchanged', () => {
    const date = new Date('2020-01-01T00:00:00.000Z')
    expect(DateScalar.serialize('2020-01-01')).toBe('2020-01-01')
    expect(DateScalar.serialize(date)).toBe(date)
  })
})
