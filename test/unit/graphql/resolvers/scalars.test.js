import { Kind } from 'graphql'
import {
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

  it.each(['1234567', '123456789', 'abcdefgh', '1234 5678', '', null, 12345678])(
    'rejects %s',
    (value) => {
      expect(() => UkAccountNumber.parseValue(value)).toThrow(
        'UkAccountNumber must be exactly 8 digits'
      )
    }
  )

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
