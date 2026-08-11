import { GraphQLError, locatedError } from 'graphql'
import { formatError } from '../../../app/graphql/formatError.js'
import { BadRequest, HttpError, NotFound, Unauthorized } from '../../../app/errors/graphql.js'

// Mirrors what graphql-js's execution engine does with a value thrown from a resolver -
// wraps it in a new, "located" GraphQLError with `originalError` set to the thrown value -
// then runs it through formatError exactly as Apollo would.
function formatThrownError(thrownValue) {
  const error = locatedError(thrownValue, undefined, ['someField'])
  const formattedError = { message: error.message, path: error.path, extensions: error.extensions }

  return formatError(formattedError, error)
}

describe('formatError', () => {
  test('strips the raw upstream response (and any PII in it) from an HttpError', () => {
    const httpError = new HttpError(400, {
      extensions: {
        response: {
          status: 400,
          body: { submittedRecord: { email: 'leak@example.com', dateOfBirth: 123456 } }
        }
      }
    })

    const result = formatThrownError(httpError)

    expect(result.message).toBe('Bad Request')
    expect(result.extensions).toEqual({ code: 'BAD REQUEST', http: { status: 400 } })
  })

  test('drops any extension not in the safe list, keeping code and http', () => {
    const notFound = new NotFound('Rural payments customer not found')

    const result = formatThrownError(notFound)

    expect(result.message).toBe('Rural payments customer not found')
    expect(result.extensions).toEqual({ code: 'NOT FOUND', http: { status: 404 } })
  })

  test('passes through Unauthorized errors', () => {
    const unauthorized = new Unauthorized('Unauthorized access')

    const result = formatThrownError(unauthorized)

    expect(result.message).toBe('Unauthorized access')
    expect(result.extensions).toEqual({ code: 'UNAUTHORIZED', http: { status: 401 } })
  })

  test('passes through BadRequest errors', () => {
    const badRequest = new BadRequest('Defra ID token does not contain crn')

    const result = formatThrownError(badRequest)

    expect(result.message).toBe('Defra ID token does not contain crn')
    expect(result.extensions).toEqual({ code: 'BAD REQUEST', http: { status: 400 } })
  })

  test('leaves the message untouched, even for unexpected errors', () => {
    const bug = new TypeError("Cannot read properties of undefined (reading 'crn')")

    const result = formatThrownError(bug)

    expect(result.message).toBe(bug.message)
    expect(result.extensions).toEqual({})
  })

  test('passes through ad-hoc GraphQLErrors raised for input validation', () => {
    const validationError = new GraphQLError('UkAccountNumber must be exactly 8 digits')

    const result = formatThrownError(validationError)

    expect(result.message).toBe('UkAccountNumber must be exactly 8 digits')
    expect(result.extensions).toEqual({})
  })

  // Query parse/validation errors never pass through a resolver, so this bypasses
  // formatThrownError and calls formatError directly, as Apollo would for this case.
  test('passes through query parse/validation errors, which never have an originalError', () => {
    const parseError = new GraphQLError('Cannot query field "bogus" on type "Query".', {
      extensions: { code: 'GRAPHQL_VALIDATION_FAILED' }
    })
    const formattedError = {
      message: parseError.message,
      path: parseError.path,
      extensions: parseError.extensions
    }

    const result = formatError(formattedError, parseError)

    expect(result.message).toBe('Cannot query field "bogus" on type "Query".')
    expect(result.extensions).toEqual({ code: 'GRAPHQL_VALIDATION_FAILED' })
  })

  test('defaults to an empty extensions object when none are present', () => {
    const result = formatError({ message: 'plain error' })

    expect(result.extensions).toEqual({})
  })
})
