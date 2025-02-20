import { buildSchema, findBreakingChanges } from 'graphql'
import { excludeFromListTransformer } from '../../../app/graphql/directives/excludeFromListTransformer.js'

describe('excludeFromListTransformer', () => {
  test('should not change schema if directive not used', () => {
    const oldSchema = buildSchema(`#graphql
        directive @excludeFromList on FIELD_DEFINITION

        type Thing {
            id: ID!
            one: String
            two: String
        }
    
        type Query {
            things: [Thing]
        }
    `)

    const newSchema = excludeFromListTransformer(oldSchema)
    const changes = findBreakingChanges(oldSchema, newSchema)

    expect(changes).toEqual([])
  })

  test('should create partial type with fields excluded', () => {
    const oldSchema = buildSchema(`#graphql
        directive @excludeFromList on FIELD_DEFINITION

        type Thing {
            id: ID!
            one: String
            two: String @excludeFromList
        }
    
        type Query {
            things: [Thing]
        }
    `)

    const newSchema = excludeFromListTransformer(oldSchema)
    const fields = Object.keys(newSchema.getType('ThingPartial').getFields())

    expect(fields).toEqual(['id', 'one'])
  })

  test('should use partial type when used in a list', () => {
    const oldSchema = buildSchema(`#graphql
        directive @excludeFromList on FIELD_DEFINITION

        type Thing {
            id: ID!
            one: String
            two: String @excludeFromList
        }
    
        type Query {
            things: [Thing]
        }
    `)

    const newSchema = excludeFromListTransformer(oldSchema)
    const changes = findBreakingChanges(oldSchema, newSchema)

    expect(changes).toEqual([
      {
        type: 'FIELD_CHANGED_KIND',
        description: 'Query.things changed type from [Thing] to [ThingPartial].'
      }
    ])
  })
})
