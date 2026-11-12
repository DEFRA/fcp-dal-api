import { ApolloServer } from '@apollo/server'
import { GraphQLError } from 'graphql'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { BadRequest, HttpError, Unauthorized } from '../../../../app/errors/graphql.js'

const loggerMock = { error: vi.fn(), warn: vi.fn() }

vi.doMock('../../../../app/logger/logger.js', () => ({
  logger: loggerMock
}))

const { errorLoggingPlugin, logGraphQLError, redactMessage } = await import(
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
        }
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
      }
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

  test('treats validation failures without an http status as client errors, logging only the code', async () => {
    const error = new GraphQLError('Cannot query field "nope" on type "Query".', {
      extensions: { code: 'GRAPHQL_VALIDATION_FAILED' }
    })

    await encounter([error], { requestLogger })

    expect(requestLogger.warn).toHaveBeenCalledWith(
      '#DAL - GraphQL error (GRAPHQL_VALIDATION_FAILED)',
      {
        code: 'DAL_GRAPHQL_ERROR_001',
        error: { name: 'GRAPHQL_VALIDATION_FAILED' }
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

  test('does not log context creation failures itself, as the context function logs them', () => {
    expect(errorLoggingPlugin().contextCreationDidFail).toBeUndefined()
  })

  test('logGraphQLError logs with the logger it is given', () => {
    const log = { error: vi.fn(), warn: vi.fn() }

    logGraphQLError(log, new Unauthorized('Defra ID token failed verification'))

    expect(log.warn).toHaveBeenCalledWith('#DAL - GraphQL error (UNAUTHORIZED)', {
      code: 'DAL_GRAPHQL_ERROR_001',
      error: {
        name: 'UNAUTHORIZED',
        message: 'Defra ID token failed verification',
        stack: undefined
      }
    })
  })

  describe('input values are never logged', () => {
    const PII = ['9234567890', 'jane.secret@example.com']
    const typeDefs = `
      enum Status { ACTIVE }
      input UpdateCustomerEmailInput { crn: String!, address: String!, count: Int, status: Status }
      type Query { ok: Boolean, business(sbi: ID!): Boolean }
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
      expect(requestLogger.warn).toHaveBeenCalledTimes(1)
      const [message, meta] = requestLogger.warn.mock.calls[0]
      const logged = JSON.stringify([message, meta])
      for (const value of PII) {
        expect(logged).not.toContain(value)
      }
      return meta.error
    }

    const mutation = `mutation UpdateCustomerEmail($input: UpdateCustomerEmailInput!) {
      updateCustomerEmail(input: $input)
    }`

    test.each([
      ['a syntax error', 'GRAPHQL_PARSE_FAILED', '{ business("9234567890") }', undefined],
      [
        'a variable with an unknown field',
        'BAD_USER_INPUT',
        mutation,
        { input: { crn: '9234567890', address: 'jane.secret@example.com', nope: 1 } }
      ],
      [
        'a variable missing a required field',
        'BAD_USER_INPUT',
        mutation,
        { input: { address: 'jane.secret@example.com' } }
      ],
      [
        'a nested invalid scalar variable',
        'BAD_USER_INPUT',
        mutation,
        { input: { crn: '1', address: 'a', count: 'jane.secret@example.com' } }
      ],
      [
        'a nested invalid enum variable',
        'BAD_USER_INPUT',
        mutation,
        { input: { crn: '1', address: 'a', status: 'jane.secret@example.com' } }
      ],
      [
        'an invalid inline literal',
        'GRAPHQL_VALIDATION_FAILED',
        'mutation { count(n: "jane.secret@example.com") }',
        undefined
      ],
      [
        'an inline literal of the wrong type',
        'GRAPHQL_VALIDATION_FAILED',
        'mutation { updateCustomerEmail(input: "jane.secret@example.com") }',
        undefined
      ]
    ])('logs only the code for %s', async (_, code, query, variables) => {
      expect(await run(query, variables)).toEqual({ name: code })
    })

    test('keeps the message of a BAD_USER_INPUT error thrown by a resolver', async () => {
      const thrown = new BadRequest('phone must include at least one of mobile or landline', {
        extensions: { code: 'BAD_USER_INPUT' }
      })

      await encounter([resolverError(thrown, ['updateBusinessPhone'])], { requestLogger })

      expect(requestLogger.warn.mock.calls[0][1].error.message).toBe(
        'phone must include at least one of mobile or landline'
      )
    })

    test.each([
      ['Int', 'count', 'Int cannot represent non-integer value: [REDACTED]'],
      ['String', 'name', 'String cannot represent value: [REDACTED]'],
      ['Status', 'status', 'Enum "Status" cannot represent value: [REDACTED]']
    ])(
      'redacts an upstream value that the %s type cannot serialize',
      async (_, field, expected) => {
        const server = new ApolloServer({
          typeDefs: `
            enum Status { ACTIVE }
            type Customer { count: Int, name: String, status: Status }
            type Query { customer: Customer }
          `,
          resolvers: {
            Query: {
              customer: () => ({
                count: 'jane.secret@example.com',
                name: { email: 'jane.secret@example.com' },
                status: 'jane.secret@example.com'
              })
            }
          },
          plugins: [errorLoggingPlugin()]
        })
        await server.start()
        await server.executeOperation(
          { query: `{ customer { ${field} } }` },
          { contextValue: { requestLogger } }
        )
        await server.stop()

        const [message, meta] = requestLogger.error.mock.calls[0]
        expect(message).toBe(`#DAL - GraphQL error at customer.${field}`)
        expect(meta.error.message).toBe(expected)
        expect(JSON.stringify([message, meta.error.message])).not.toContain('jane.secret')
      }
    )

    test('leaves messages without values untouched', () => {
      expect(
        redactMessage(new BadRequest('Defra ID token is not valid for the provided SBI'))
      ).toBe('Defra ID token is not valid for the provided SBI')
    })
  })
})
