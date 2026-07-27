import { buildSchema, graphql } from 'graphql'
import { validateVariableDirective } from '../../../app/graphql/directives/validateVariable.js'

describe('validateVariable Directive', () => {
  it('should validate the argument against the specified pattern and return data', async () => {
    const schema = buildSchema(`#graphql
        directive @validateVariable(pattern: String!, variable: String!) on FIELD_DEFINITION

        type Query {
            business(sbi: ID!): String @validateVariable(pattern: "^[0-9]{9}$", variable: "sbi")
        }
    `)
    const transformedSchema = validateVariableDirective(schema)

    const query = `#graphql
        query {
            business(sbi: "123456789")
        }
    `

    const validResult = await graphql({ schema: transformedSchema, source: query })
    expect(validResult.errors).toBeUndefined()
    expect(validResult.data).toHaveProperty('business')
  })

  it('should throw an error if the argument does not match the pattern', async () => {
    const schema = buildSchema(`#graphql
        directive @validateVariable(pattern: String!, variable: String!) on FIELD_DEFINITION

        type Query {
            business(sbi: ID!): String @validateVariable(pattern: "^[0-9]{9}$", variable: "sbi")
        }
    `)
    const transformedSchema = validateVariableDirective(schema)

    const query = `#graphql
        query {
            business(sbi: "invalid_sbi")
        }
    `

    const invalidResult = await graphql({ schema: transformedSchema, source: query })
    expect(invalidResult.errors?.[0]?.message).toMatch(/sbi must match pattern/)
  })
})
