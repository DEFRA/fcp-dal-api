import { GraphQLError, GraphQLScalarType, Kind } from 'graphql'

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

export { IBANResolver as IBAN } from 'graphql-scalars'
