import { buildSchema, graphql } from 'graphql'
import { validateVariableDirective } from '../../../app/graphql/directives/validateVariable.js'

describe('validateVariable Directive', () => {
  const schema = buildSchema(`#graphql
        directive @validateVariable(pattern: String!) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION

        type Query {
        test(
            """
            Some description of the id field
            """
            id:  ID! @validateVariable(pattern: "^[1-9]\\\\d{8}$"),
            id2: ID! @validateVariable(pattern: "^\\\\d{3}$")
        ): String
        }

        input TestInput {
            id:  ID! @validateVariable(pattern: "^[1-9]\\\\d{8}$"),
            """
            Some description of the id field
            """
            id2: ID! @validateVariable(pattern: "^\\\\d{3}$")
        }
        type Mutation {
            testMutation(input: TestInput!):  String
        }
    `)
  const transformedSchema = validateVariableDirective(schema)

  describe('resolver argument support', () => {
    it('should annotate argument descriptions with the constraint pattern', () => {
      const queryType = transformedSchema.getQueryType()
      const testField = queryType.getFields().test

      expect(testField.args[0].description).toEqual(
        'Some description of the id field\n\n*Constraint:* must match pattern `^[1-9]\\d{8}$`'
      )
      expect(testField.args[1].description).toEqual('*Constraint:* must match pattern `^\\d{3}$`')
    })

    it('should validate variable value against its specified pattern', async () => {
      const query = `#graphql
        query {
            test(id: "123456789", id2: "123")
        }`

      const validResult = await graphql({ schema: transformedSchema, source: query })

      expect(validResult.errors).toBeUndefined()
      expect(validResult.data).toHaveProperty('test')
    })

    it('should throw an error if a variable value does not match the pattern', async () => {
      const badIdQuery = `#graphql
        query {
            test(id: "invalid_id", id2: "invalid_id2")
        }`

      let invalidResult = await graphql({ schema: transformedSchema, source: badIdQuery })
      expect(invalidResult.errors).toHaveLength(1) // only first error thrown, then process aborts
      expect(invalidResult.errors?.[0]?.message).toMatch(/variable 'id' must match pattern/)

      const badId2Query = `#graphql
        query {
            test(id: "123456789", id2: "invalid_id2")
        }`

      invalidResult = await graphql({ schema: transformedSchema, source: badId2Query })
      expect(invalidResult.errors).toHaveLength(1)
      expect(invalidResult.errors?.[0]?.message).toMatch(/variable 'id2' must match pattern/)
    })
  })

  describe('input object support', () => {
    it('should annotate input field descriptions with the constraint pattern', () => {
      const inputFields = transformedSchema.getType('TestInput').getFields()

      expect(inputFields.id.description).toEqual('*Constraint:* must match pattern `^[1-9]\\d{8}$`')
      expect(inputFields.id2.description).toEqual(
        'Some description of the id field\n\n*Constraint:* must match pattern `^\\d{3}$`'
      )
    })

    it('should validate nested input object field values', async () => {
      const query = `#graphql
        mutation {
            testMutation(input: { id: "123456789", id2: "123" })
        }`

      const validResult = await graphql({ schema: transformedSchema, source: query })

      expect(validResult.errors).toBeUndefined()
      expect(validResult.data).toHaveProperty('testMutation')
    })

    it('should throw an error for invalid nested input object field values', async () => {
      const invalidMutation = `#graphql
        mutation {
            testMutation(input: { id: "invalid_id", id2: "123" })
        }`

      let invalidResult = await graphql({ schema: transformedSchema, source: invalidMutation })
      expect(invalidResult.errors).toHaveLength(1)
      expect(invalidResult.errors?.[0]?.message).toMatch(/variable 'input.id' must match pattern/)

      const invalidMutation2 = `#graphql
        mutation {
            testMutation(input: { id: "123456789", id2: "invalid_id" })
        }
        `

      invalidResult = await graphql({ schema: transformedSchema, source: invalidMutation2 })
      expect(invalidResult.errors).toHaveLength(1)
      expect(invalidResult.errors?.[0]?.message).toMatch(/variable 'input.id2' must match pattern/)
    })
  })
})
