import { GraphQLError, GraphQLScalarType, Kind, valueFromASTUntyped } from 'graphql'
import { isValidGeoJson } from '../../utils/geo-json.js'

const makeStringScalar = ({ name, description, pattern, message }) =>
  new GraphQLScalarType({
    name,
    description,
    serialize: (value) => value,
    parseValue: (value) => {
      if (typeof value !== 'string' || !pattern.test(value)) {
        throw new GraphQLError(message)
      }
      return value
    },
    parseLiteral: (ast) => {
      if (ast.kind !== Kind.STRING || !pattern.test(ast.value)) {
        throw new GraphQLError(message)
      }
      return ast.value
    }
  })

export const UkAccountNumber = makeStringScalar({
  name: 'UkAccountNumber',
  description: 'A UK bank account number: exactly 8 digits.',
  pattern: /^\d{8}$/,
  message: 'UkAccountNumber must be exactly 8 digits'
})

export const UkSortCode = makeStringScalar({
  name: 'UkSortCode',
  description: 'A UK bank sort code: exactly 6 digits.',
  pattern: /^\d{6}$/,
  message: 'UkSortCode must be exactly 6 digits'
})

export const SwiftCode = makeStringScalar({
  name: 'SwiftCode',
  description: 'A SWIFT/BIC code: 8 or 11 alphanumeric characters.',
  pattern: /^[A-Z0-9]{8}([A-Z0-9]{3})?$/,
  message: 'SwiftCode must be 8 or 11 uppercase alphanumeric characters'
})

const validateGeoJson = (value) => {
  if (!isValidGeoJson(value)) {
    throw new GraphQLError('GeoJSON must have a string "type" and an array "coordinates"')
  }
  return value
}

export const GeoJSON = new GraphQLScalarType({
  name: 'GeoJSON',
  description:
    'A GeoJSON-shaped geometry object (`{ type, coordinates }`) as returned by the upstream ' +
    'LMS API, whose coordinates array varies by type.  The upstream contract is loosely typed, so ' +
    'only the shallow type/coordinates shape is validated.',
  serialize: validateGeoJson,
  parseValue: validateGeoJson,
  parseLiteral: (ast) => {
    if (ast.kind !== Kind.OBJECT) {
      throw new GraphQLError('GeoJSON must be an object')
    }
    return validateGeoJson(valueFromASTUntyped(ast))
  }
})

export { IBANResolver as IBAN } from 'graphql-scalars'
