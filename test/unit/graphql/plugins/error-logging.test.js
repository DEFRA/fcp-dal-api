import { ApolloServer } from '@apollo/server'
import { GraphQLError } from 'graphql'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { BadRequest, HttpError, Unauthorized } from '../../../../app/errors/graphql.js'

const loggerMock = { error: vi.fn(), warn: vi.fn() }

vi.doMock('../../../../app/logger/logger.js', () => ({
  logger: loggerMock
}))

const { errorLoggingPlugin, redactMessage } = await import(
  '../../../../app/graphql/plugins/error-logging.js'
)

// Mirrors how graphql-js wraps an error thrown in a resolver: the thrown error becomes
// originalError, its extensions are copied across and the resolver path is attached
const resolverError = (thrown, path) =>
  new GraphQLError(thrown.message, {
    path,
    originalError: thrown,
    extensions: thrown.extensions
  })

const encounter = async (errors, contextValue) => {
  const hooks = await errorLoggingPlugin().requestDidStart()
  await hooks.didEncounterErrors({ contextValue, errors })
}

describe('errorLoggingPlugin', () => {
  const requestLogger = { error: vi.fn(), warn: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('logs a client error as a warning on the request logger, without a stack', async () => {
    const error = resolverError(
      new BadRequest('Defra ID token is not valid for the provided SBI'),
      ['business', 'info']
    )

    await encounter([error], { requestLogger })

    expect(requestLogger.warn).toHaveBeenCalledWith(
      '#DAL - GraphQL error at business.info (BAD REQUEST)',
      {
        code: 'DAL_GRAPHQL_ERROR_001',
        error: {
          name: 'BAD REQUEST',
          message: 'Defra ID token is not valid for the provided SBI',
          stack: undefined
        },
        response: { statusCode: 400 }
      }
    )
    expect(requestLogger.error).not.toHaveBeenCalled()
    expect(loggerMock.warn).not.toHaveBeenCalled()
  })

  test('logs a server error as an error with the original stack, and never logs extensions', async () => {
    const thrown = new HttpError(500, {
      extensions: { request: { body: 'pii' }, response: { body: 'pii' } }
    })
    const error = resolverError(thrown, ['customer'])

    await encounter([error], { requestLogger })

    expect(requestLogger.error).toHaveBeenCalledTimes(1)
    const [message, meta] = requestLogger.error.mock.calls[0]
    expect(message).toBe('#DAL - GraphQL error at customer (INTERNAL SERVER ERROR)')
    expect(meta).toEqual({
      code: 'DAL_GRAPHQL_ERROR_001',
      error: {
        name: 'INTERNAL SERVER ERROR',
        message: 'Internal Server Error',
        stack: thrown.stack
      },
      response: { statusCode: 500 }
    })
    expect(JSON.stringify(meta)).not.toContain('pii')
  })

  test('treats an unexpected error with no status or code as a server error', async () => {
    const thrown = new TypeError('cannot read properties of undefined')
    const error = resolverError(thrown, ['business'])

    await encounter([error], { requestLogger })

    expect(requestLogger.error).toHaveBeenCalledWith('#DAL - GraphQL error at business', {
      code: 'DAL_GRAPHQL_ERROR_001',
      error: {
        name: 'GraphQLError',
        message: 'cannot read properties of undefined',
        stack: thrown.stack
      }
    })
  })

  test('treats validation failures without an http status as client errors', async () => {
    const error = new GraphQLError('Cannot query field "nope" on type "Query".', {
      extensions: { code: 'GRAPHQL_VALIDATION_FAILED' }
    })

    await encounter([error], { requestLogger })

    expect(requestLogger.warn).toHaveBeenCalledWith(
      '#DAL - GraphQL error (GRAPHQL_VALIDATION_FAILED)',
      {
        code: 'DAL_GRAPHQL_ERROR_001',
        error: {
          name: 'GRAPHQL_VALIDATION_FAILED',
          message: 'Cannot query field "nope" on type "Query".',
          stack: undefined
        }
      }
    )
  })

  test('logs each error separately', async () => {
    await encounter(
      [resolverError(new BadRequest('one'), ['a']), resolverError(new BadRequest('two'), ['b'])],
      { requestLogger }
    )

    expect(requestLogger.warn).toHaveBeenCalledTimes(2)
  })

  test('falls back to the base logger when there is no request logger', async () => {
    await encounter([resolverError(new BadRequest('oops'), ['a'])], undefined)

    expect(loggerMock.warn).toHaveBeenCalledTimes(1)
  })

  test('logs context creation failures with the base logger', async () => {
    const error = new Unauthorized('Defra ID token failed verification')

    await errorLoggingPlugin().contextCreationDidFail({ error })

    expect(loggerMock.warn).toHaveBeenCalledWith('#DAL - GraphQL error (UNAUTHORIZED)', {
      code: 'DAL_GRAPHQL_ERROR_001',
      error: {
        name: 'UNAUTHORIZED',
        message: 'Defra ID token failed verification',
        stack: undefined
      },
      response: { statusCode: 401 }
    })
  })

  describe('input values are never logged', () => {
    const PII = ['9234567890', 'jane.secret@example.com']
    const typeDefs = `
      enum Status { ACTIVE }
      input UpdateCustomerEmailInput { crn: String!, address: String!, count: Int, status: Status }
      type Query { ok: Boolean }
      type Mutation {
        updateCustomerEmail(input: UpdateCustomerEmailInput!): Boolean
        count(n: Int): Boolean
      }
    `

    const run = async (query, variables) => {
      const server = new ApolloServer({ typeDefs, plugins: [errorLoggingPlugin()] })
      await server.start()
      await server.executeOperation({ query, variables }, { contextValue: { requestLogger } })
      await server.stop()
      const [message, meta] = requestLogger.warn.mock.calls[0]
      const logged = JSON.stringify([message, meta])
      for (const value of PII) {
        expect(logged).not.toContain(value)
      }
      return meta.error.message
    }

    const mutation = `mutation UpdateCustomerEmail($input: UpdateCustomerEmailInput!) {
      updateCustomerEmail(input: $input)
    }`

    test('redacts the value of a variable with an unknown field', async () => {
      const message = await run(mutation, {
        input: { crn: '9234567890', address: 'jane.secret@example.com', nope: 1 }
      })
      expect(message).toBe(
        'Variable "$input" got invalid value [REDACTED]; Field "nope" is not defined by type "UpdateCustomerEmailInput".'
      )
    })

    test('redacts the value of a variable missing a required field', async () => {
      const message = await run(mutation, { input: { address: 'jane.secret@example.com' } })
      expect(message).toBe(
        'Variable "$input" got invalid value [REDACTED]; Field "crn" of required type "String!" was not provided.'
      )
    })

    test('redacts a nested invalid scalar value but keeps the path', async () => {
      const message = await run(mutation, {
        input: { crn: '1', address: 'a', count: 'jane.secret@example.com' }
      })
      expect(message).toBe(
        'Variable "$input" got invalid value [REDACTED] at "input.count"; Int cannot represent non-integer value: [REDACTED]'
      )
    })

    test('redacts a nested invalid enum value', async () => {
      const message = await run(mutation, {
        input: { crn: '1', address: 'a', status: 'jane.secret@example.com' }
      })
      expect(message).toBe(
        'Variable "$input" got invalid value [REDACTED] at "input.status"; Value [REDACTED] does not exist in "Status" enum.'
      )
    })

    test('redacts an invalid inline literal', async () => {
      const message = await run('mutation { count(n: "jane.secret@example.com") }')
      expect(message).toBe('Int cannot represent non-integer value: [REDACTED]')
    })

    test('redacts an inline literal of the wrong type', async () => {
      const message = await run(
        'mutation { updateCustomerEmail(input: "jane.secret@example.com") }'
      )
      expect(message).toBe('Expected value of type "UpdateCustomerEmailInput!", found [REDACTED].')
    })

    test('redacts values in third party scalar messages', () => {
      expect(redactMessage(new GraphQLError('Value is not a valid IBAN: GB00SECRET'))).toBe(
        'Value is not a valid IBAN: [REDACTED]'
      )
    })

    test('drops the reason if it cannot be separated from the value', () => {
      expect(
        redactMessage(new GraphQLError('Variable "$input" got invalid value "9234567890"; oops'))
      ).toBe('Variable "$input" got invalid value [REDACTED]')
    })

    test('leaves messages without values untouched', () => {
      expect(
        redactMessage(new BadRequest('Defra ID token is not valid for the provided SBI'))
      ).toBe('Defra ID token is not valid for the provided SBI')
    })
  })
})
