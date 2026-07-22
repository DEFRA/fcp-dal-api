import { makeExecutableSchema } from '@graphql-tools/schema'
import { graphql } from 'graphql'
import { externalToServiceAccountDirectiveTransformer } from '../../../app/graphql/directives/externalToServiceAccount.js'

const typeDefs = `#graphql
  directive @externalToServiceAccount on FIELD_DEFINITION

  type Widget {
    taggedField: String @externalToServiceAccount
    untaggedField: String
  }

  type Query {
    widget: Widget
  }
`

function buildSchema(sdl) {
  const schema = makeExecutableSchema({
    typeDefs: sdl,
    resolvers: {
      Widget: {
        taggedField: async (_source, _args, context) => {
          return context.dataSources.ruralPaymentsBusiness.marker
        },
        untaggedField: async (_source, _args, context) => {
          return context.dataSources.ruralPaymentsBusiness.marker
        }
      },
      Query: {
        widget: () => ({})
      }
    }
  })
  return externalToServiceAccountDirectiveTransformer(schema)
}

function buildContext({ gatewayType, withServiceAccount = true }) {
  return {
    gatewayType,
    dataSources: {
      ruralPaymentsBusiness: { marker: 'standard' },
      ...(withServiceAccount
        ? { serviceAccount: { ruralPaymentsBusiness: { marker: 'service-account' } } }
        : {})
    }
  }
}

describe('externalToServiceAccountDirectiveTransformer', () => {
  test('swaps to the service-account data source when gatewayType is external', async () => {
    const schema = buildSchema(typeDefs)
    const contextValue = buildContext({ gatewayType: 'external' })

    const result = await graphql({
      schema,
      source: '{ widget { taggedField } }',
      contextValue
    })

    expect(result.errors).toBeUndefined()
    expect(result.data.widget.taggedField).toBe('service-account')
  })

  test('leaves the standard (non-service-account) data source when gatewayType is internal (no-op)', async () => {
    const schema = buildSchema(typeDefs)
    const contextValue = buildContext({ gatewayType: 'internal' })

    const result = await graphql({
      schema,
      source: '{ widget { taggedField } }',
      contextValue
    })

    expect(result.errors).toBeUndefined()
    expect(result.data.widget.taggedField).toBe('standard')
  })

  test('throws a descriptive error when the service-account data source is missing from context', async () => {
    const schema = buildSchema(typeDefs)
    const contextValue = buildContext({ gatewayType: 'external', withServiceAccount: false })

    const result = await graphql({
      schema,
      source: '{ widget { taggedField } }',
      contextValue
    })

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toMatch(
      /@externalToServiceAccount misconfigured.*ruralPaymentsBusiness is missing/
    )
  })
})
