import { buildSchema, graphql } from 'graphql'
import { validateVariableDirective } from '../../../app/graphql/directives/validateVariable.js'

describe('validateVariable Directive', () => {
  const schema = buildSchema(`#graphql
        directive @validateVariable(pattern: String!) on ARGUMENT_DEFINITION

        type Query {
            test(
                """
                Some description of the id field
                """
                id:  ID! @validateVariable(pattern: "^[1-9]\\\\d{8}$"),
                id2: ID! @validateVariable(pattern: "^\\\\d{3}$")
            ): String
        }
    `)
  const transformedSchema = validateVariableDirective(schema)

  it('should annotate argument descriptions with the constraint pattern', () => {
    const queryType = transformedSchema.getQueryType()
    const testField = queryType.getFields().test

    expect(testField.args[0].description).toEqual(
      'Some description of the id field\n*Constraint:* must match pattern `^[1-9]\\d{8}$`'
    )
    expect(testField.args[1].description).toEqual('\n*Constraint:* must match pattern `^\\d{3}$`')
  })

  it('should validate each variable against its specified pattern and return data', async () => {
    const query = `#graphql
        query {
            test(id: "123456789", id2: "123")
        }
    `
    const validResult = await graphql({ schema: transformedSchema, source: query })

    expect(validResult.errors).toBeUndefined()
    expect(validResult.data).toHaveProperty('test')
  })

  it('should throw an error if a variable does not match the pattern', async () => {
    const badIdQuery = `#graphql
        query {
            test(id: "invalid_id", id2: "invalid_id2")
        }
    `
    let invalidResult = await graphql({ schema: transformedSchema, source: badIdQuery })
    expect(invalidResult.errors).toHaveLength(1) // only first error thrown, then process aborts
    expect(invalidResult.errors?.[0]?.message).toMatch(/variable 'id' must match pattern/)

    const badId2Query = `#graphql
        query {
            test(id: "123456789", id2: "invalid_id2")
        }
    `
    invalidResult = await graphql({ schema: transformedSchema, source: badId2Query })
    expect(invalidResult.errors).toHaveLength(1)
    expect(invalidResult.errors?.[0]?.message).toMatch(/variable 'id2' must match pattern/)
  })
})
