import { buildSchema, graphql } from 'graphql'
import {
  validateVariableDirective,
  validateVariablesDirective
} from '../../../app/graphql/directives/validateVariable.js'

describe('validateVariable Directive', () => {
  it('should validate the variable against the specified pattern and return data', async () => {
    const schema = buildSchema(`#graphql
        directive @validateVariable(pattern: String!, variable: String!) on FIELD_DEFINITION

        type Query {
            test(id: ID!): String @validateVariable(pattern: "^[0-9]{9}$", variable: "id")
        }
    `)
    const transformedSchema = validateVariableDirective(schema)

    const query = `#graphql
        query {
            test(id: "123456789")
        }
    `

    const validResult = await graphql({ schema: transformedSchema, source: query })
    expect(validResult.errors).toBeUndefined()
    expect(validResult.data).toHaveProperty('test')
  })

  it('should throw an error if the variable does not match the pattern', async () => {
    const schema = buildSchema(`#graphql
        directive @validateVariable(pattern: String!, variable: String!) on FIELD_DEFINITION

        type Query {
            test(id: ID!): String @validateVariable(pattern: "^[0-9]{9}$", variable: "id")
        }
    `)
    const transformedSchema = validateVariableDirective(schema)

    const query = `#graphql
        query {
            test(id: "invalid_id")
        }
    `

    const invalidResult = await graphql({ schema: transformedSchema, source: query })
    expect(invalidResult.errors?.[0]?.message).toMatch(/variable 'id' must match pattern/)
  })
})

describe('validateVariables Directive', () => {
  it('should validate the variable against the specified pattern and return data', async () => {
    const schema = buildSchema(`#graphql
        directive @validateVariables(patterns: [String!], variables: [String!]) on FIELD_DEFINITION

        type Query {
            test(id: ID!, id2: ID!): String
                @validateVariables(patterns: ["^[0-9]{9}$", "^\\\\d+$"], variables: ["id", "id2"])
        }
    `) // NOTE: the uber escaping needed here for this pattern ☝️ first for this string,
    //          then the outer graphql interpolator
    const transformedSchema = validateVariablesDirective(schema)

    const query = `#graphql
        query {
            test(id: "123456789", id2: "12345")
        }
    `

    const validResult = await graphql({ schema: transformedSchema, source: query })
    expect(validResult.errors).toBeUndefined()
    expect(validResult.data).toHaveProperty('test')
  })

  it('should throw an error if the variable does not match the patterns', async () => {
    const schema = buildSchema(`#graphql
        directive @validateVariables(patterns: [String!], variables: [String!]) on FIELD_DEFINITION

        type Query {
            test(id: ID!, id2: ID!): String
                @validateVariables(patterns: ["^[0-9]{9}$", "^\\\\d+$"], variables: ["id", "id2"])
        }
    `)
    const transformedSchema = validateVariablesDirective(schema)

    const query = `#graphql
        query {
            test(id: "invalid_id", id2: "invalid_id2")
        }
    `

    const invalidResult = await graphql({ schema: transformedSchema, source: query })
    expect(invalidResult.errors?.[0]?.message).toMatch(/variable 'id' must match pattern/)
  })
})
