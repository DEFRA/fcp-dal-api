import { ApolloServer } from '@apollo/server'
import { getIntrospectionQuery } from 'graphql'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { Forbidden, Unauthorized } from '../../../../app/errors/graphql.js'
import { formatError } from '../../../../app/graphql/formatError.js'
import { anonymousIntrospectionPlugin } from '../../../../app/graphql/plugins/anonymous-introspection.js'

const typeDefs = `#graphql
  type Query {
    business(sbi: ID!): Business
  }
  type Business {
    sbi: ID
  }
`

const businessResolver = vi.fn(() => ({ sbi: '823456789' }))
const resolvers = { Query: { business: businessResolver } }
const requestLogger = { info: vi.fn() }

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [anonymousIntrospectionPlugin()],
  formatError
})

const run = async (query, deferredAuthError) => {
  const { body, http } = await server.executeOperation(
    { query },
    { contextValue: { deferredAuthError, requestLogger } }
  )
  return { ...body.singleResult, status: http.status }
}

const unauthorised = new Unauthorized(
  'Authorization failed, a valid authorization token is required'
)

describe('anonymousIntrospectionPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('does nothing for an authorised request', async () => {
    const result = await run('{ business(sbi: "823456789") { sbi } }')

    expect(result.errors).toBeUndefined()
    expect(result.data).toEqual({ business: { sbi: '823456789' } })
    expect(requestLogger.info).not.toHaveBeenCalled()
  })

  describe('for an unauthorised request', () => {
    test.each([
      ['the standard introspection query', getIntrospectionQuery()],
      ['a __typename query', '{ __typename }'],
      ['a __type query', '{ __type(name: "Business") { name } }'],
      ['aliased introspection fields', '{ s: __schema { queryType { name } } t: __typename }'],
      [
        'introspection fields in fragments',
        'query { ...A ... { __typename } } fragment A on Query { __schema { queryType { name } } }'
      ]
    ])('allows %s, and logs that it was allowed', async (_name, query) => {
      const result = await run(query, unauthorised)

      expect(result.errors).toBeUndefined()
      expect(result.data).toBeDefined()
      expect(requestLogger.info).toHaveBeenCalledExactlyOnceWith(
        '#DAL Request authentication - unauthorised introspection query allowed',
        { type: 'http', code: 'DAL_REQUEST_AUTHENTICATION_001', reason: 'UNAUTHORIZED' }
      )
    })

    test.each([
      ['a real root field', '{ business(sbi: "823456789") { sbi } }'],
      [
        'a real root field alongside introspection',
        '{ __schema { queryType { name } } business(sbi: "823456789") { sbi } }'
      ],
      [
        'a real root field in a fragment',
        'query { __typename ...A } fragment A on Query { business(sbi: "823456789") { sbi } }'
      ],
      [
        'a skipped real root field',
        '{ __typename business(sbi: "823456789") @skip(if: true) { sbi } }'
      ]
    ])('rejects %s with the deferred error, without running resolvers', async (_name, query) => {
      const result = await run(query, unauthorised)

      expect(result.status).toBe(401)
      expect(result.data).toBeUndefined()
      expect(result.errors).toEqual([
        expect.objectContaining({
          message: 'Authorization failed, a valid authorization token is required',
          extensions: expect.objectContaining({ code: 'UNAUTHORIZED' })
        })
      ])
      expect(businessResolver).not.toHaveBeenCalled()
      expect(requestLogger.info).not.toHaveBeenCalled()
    })

    test('rejects with a deferred Forbidden error as 403', async () => {
      const forbidden = new Forbidden(
        'Authorization failed, requester is not an authorised DAL consumer'
      )

      const result = await run('{ business(sbi: "823456789") { sbi } }', forbidden)

      expect(result.status).toBe(403)
      expect(result.errors).toEqual([
        expect.objectContaining({ extensions: expect.objectContaining({ code: 'FORBIDDEN' }) })
      ])
    })
  })
})
