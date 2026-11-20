import { GraphQLError, GraphQLScalarType, Kind } from 'graphql'
import { validateDateInput } from '../../utils/date.js'

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

const DATE_TYPE_MESSAGE = 'Date must be a string, ideally in ISO 8601 format, e.g. 2020-01-01'

/**
 * Checks a client-supplied Date input and parses it into a `Date`.
 *
 * `Date` objects are accepted because in-process callers (e.g. tests using `graphql()` directly)
 * can pass them as variables; HTTP clients can only send strings or numbers.
 *
 * @param {string|number|Date} value - The raw input value.
 * @returns {Date} The parsed date (a new object, even when given a `Date`).
 * @throws {GraphQLError} If the value is not a string, number or `Date`.
 * @throws {BadRequest} If the value cannot be parsed into a valid date.
 */
const parseDateInput = (value) => {
  if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
    throw new GraphQLError(DATE_TYPE_MESSAGE)
  }
  return validateDateInput(value)
}

/**
 * Date scalar: checks that inputs are valid dates and gives resolvers a `Date` object.
 *
 * This is deliberately lenient. It accepts anything JavaScript's `Date` constructor can parse
 * (e.g. `2020-01-01`, `2020-01-01T00:00:00.000Z`, but also `01-01-2020` or `Jan 1 2020`),
 * because that is what clients could send before this scalar existed, and rejecting other
 * formats would be a breaking change. Note that `new Date()` reads date-only ISO strings as
 * UTC midnight but other formats (and date-times without an offset) as local time.
 *
 * Resolvers always receive a `Date` (or `undefined` when the argument is omitted), so the
 * downstream code only ever has to deal with `Date` objects.
 *
 * Outputs go through unchanged, as resolvers already return a mix of ISO date strings, ISO
 * timestamps and `Date` objects (which serialize to ISO timestamps).
 *
 * Future improvement: once clients are confirmed to send ISO 8601 only, make this strict: accept
 * only `YYYY-MM-DD` or a full ISO 8601 date-time, and reject impossible dates such as
 * `2025-02-30` (which `new Date()` rolls over to 2 March).
 */
const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'A date, ideally in ISO 8601 format, e.g. 2020-01-01 or 2020-01-01T00:00:00.000Z.',
  serialize: (value) => value,
  parseValue: parseDateInput,
  parseLiteral: (ast) => {
    if (ast.kind === Kind.STRING) {
      return parseDateInput(ast.value)
    }
    if (ast.kind === Kind.INT) {
      return parseDateInput(Number(ast.value))
    }
    throw new GraphQLError(DATE_TYPE_MESSAGE)
  }
})

// Exported under an alias so it does not shadow the global `Date` in this module
export { DateScalar as Date }

export { IBANResolver as IBAN } from 'graphql-scalars'
