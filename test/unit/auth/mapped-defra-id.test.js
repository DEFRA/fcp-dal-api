import { ApolloServer } from '@apollo/server'
import { parse, validate } from 'graphql'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  assertMappedOperationAllowed,
  MAPPED_QUERIES_ONLY_MESSAGE,
  MAPPED_SBI_MESSAGE,
  mappedDefraIdApolloPlugin
} from '../../../app/auth/mapped-defra-id.js'
import { createSchema } from '../../../app/graphql/schema.js'

describe('assertMappedOperationAllowed', () => {
  let schema
  beforeAll(async () => {
    schema = await createSchema()
  })

  const check = (source, variables) => {
    const document = parse(source)
    expect(validate(schema, document)).toEqual([])
    const operation = document.definitions.find(({ kind }) => kind === 'OperationDefinition')
    return () =>
      assertMappedOperationAllowed({
        schema,
        document,
        operation,
        variables,
        sbis: new Set(['810000000'])
      })
  }

  it('allows a mapped SBI given as a literal', () => {
    expect(check('{ business(sbi: "810000000") { sbi } }')).not.toThrow()
  })

  it('allows a mapped SBI given as a variable, including a number', () => {
    const source = 'query ($sbi: ID!) { business(sbi: $sbi) { sbi } }'
    expect(check(source, { sbi: '810000000' })).not.toThrow()
    expect(check(source, { sbi: 810000000 })).not.toThrow()
  })

  it('allows the business subtree, including its customers', () => {
    const source = `{
      business(sbi: "810000000") {
        customers { crn }
        customer(crn: "9100000001") { crn }
      }
    }`
    expect(check(source)).not.toThrow()
  })

  it('allows __typename', () => {
    expect(check('{ __typename }')).not.toThrow()
  })

  it.each([
    ['as a literal', '{ business(sbi: "810000001") { sbi } }', undefined],
    ['as a variable', 'query ($sbi: ID!) { business(sbi: $sbi) { sbi } }', { sbi: '810000001' }],
    [
      'behind an alias alongside a mapped one',
      '{ a: business(sbi: "810000000") { sbi } b: business(sbi: "810000001") { sbi } }',
      undefined
    ],
    [
      'in a fragment',
      'query { ...F } fragment F on Query { business(sbi: "810000001") { sbi } }',
      undefined
    ],
    [
      'in a skipped inline fragment',
      '{ ... @skip(if: true) { business(sbi: "810000001") { sbi } } }',
      undefined
    ]
  ])('refuses an SBI that is not mapped %s', (_, source, variables) => {
    expect(check(source, variables)).toThrow(
      expect.objectContaining({
        message: MAPPED_SBI_MESSAGE,
        extensions: expect.objectContaining({ code: 'BAD REQUEST' })
      })
    )
  })

  it.each([
    ['customer', '{ customer(crn: "9100000001") { crn } }'],
    ['businessSearch', '{ businessSearch(searchString: "x", searchType: SBI) { __typename } }'],
    ['__schema', '{ __schema { queryType { name } } }']
  ])('refuses the %s root field', (name, source) => {
    expect(check(source)).toThrow(
      expect.objectContaining({
        message: `${name} is not available for a mapped Defra ID token`,
        extensions: expect.objectContaining({ code: 'FORBIDDEN' })
      })
    )
  })

  it('refuses a mutation', () => {
    expect(check('mutation { __typename }')).toThrow(
      expect.objectContaining({
        message: MAPPED_QUERIES_ONLY_MESSAGE,
        extensions: expect.objectContaining({ code: 'FORBIDDEN' })
      })
    )
  })
})

describe('mappedDefraIdApolloPlugin', () => {
  const business = vi.fn(() => ({ sbi: '810000000' }))
  const apolloServer = new ApolloServer({
    typeDefs: 'type Query { business(sbi: ID!): Business } type Business { sbi: ID }',
    resolvers: { Query: { business } },
    plugins: [mappedDefraIdApolloPlugin()]
  })
  const run = (sbi, app) =>
    apolloServer.executeOperation(
      { query: 'query ($sbi: ID!) { business(sbi: $sbi) { sbi } }', variables: { sbi } },
      { contextValue: { request: { app } } }
    )

  beforeEach(() => {
    business.mockClear()
  })

  it('runs a mapped request for a mapped SBI', async () => {
    const { body } = await run('810000000', {
      mappedDefraId: { dummyCrn: '9100000001', sbis: new Set(['810000000']) }
    })

    expect(body.singleResult.errors).toBeUndefined()
    expect(body.singleResult.data).toEqual({ business: { sbi: '810000000' } })
  })

  it('refuses a mapped request for another SBI before any resolver runs', async () => {
    const { http, body } = await run('810000001', {
      mappedDefraId: { dummyCrn: '9100000001', sbis: new Set(['810000000']) }
    })

    expect(http.status).toBe(400)
    expect(body.singleResult.errors).toEqual([
      expect.objectContaining({ message: MAPPED_SBI_MESSAGE })
    ])
    expect(business).not.toHaveBeenCalled()
  })

  it('leaves requests that are not mapped alone', async () => {
    const { body } = await run('810000001', {})

    expect(body.singleResult.errors).toBeUndefined()
    expect(business).toHaveBeenCalled()
  })
})
