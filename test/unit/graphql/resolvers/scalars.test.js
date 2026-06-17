import { Kind } from 'graphql'
import {
  GeoJSON,
  SwiftCode,
  UkAccountNumber,
  UkSortCode
} from '../../../../app/graphql/resolvers/scalars.js'

const stringLiteral = (value) => ({ kind: Kind.STRING, value })
const intLiteral = (value) => ({ kind: Kind.INT, value: `${value}` })
const floatLiteral = (value) => ({ kind: Kind.FLOAT, value: `${value}` })
const objectField = (name, value) => ({
  kind: Kind.OBJECT_FIELD,
  name: { kind: Kind.NAME, value: name },
  value
})

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

describe('GeoJSON scalar', () => {
  const bngPoint = { type: 'Point', coordinates: [266375.64, 128194.34] }
  const invalidMessage = 'GeoJSON must have a string "type" and an array "coordinates"'

  it('accepts a geometry with coordinates', () => {
    expect(GeoJSON.parseValue(bngPoint)).toEqual(bngPoint)
    expect(GeoJSON.serialize(bngPoint)).toEqual(bngPoint)

    const bngPointLiteral = {
      kind: Kind.OBJECT,
      fields: [
        objectField('type', stringLiteral('Point')),
        objectField('coordinates', {
          kind: Kind.LIST,
          values: [floatLiteral(266375.64), floatLiteral(128194.34)]
        })
      ]
    }
    expect(GeoJSON.parseLiteral(bngPointLiteral)).toEqual(bngPoint)
  })

  it('accepts an empty coordinates array', () => {
    const value = { type: 'Point', coordinates: [] }
    expect(GeoJSON.parseValue(value)).toEqual(value)
  })

  it.each([null, { type: 'Point' }, { coordinates: [] }, 'Point', 42])('rejects %p', (value) => {
    expect(() => GeoJSON.parseValue(value)).toThrow(invalidMessage)
    expect(() => GeoJSON.serialize(value)).toThrow(invalidMessage)
  })

  it('rejects a non-object literal', () => {
    expect(() => GeoJSON.parseLiteral(stringLiteral('Point'))).toThrow('GeoJSON must be an object')
  })
})
