import { parse } from 'graphql'
import { describe, expect, test } from 'vitest'
import { fragmentsByName, rootFieldNodes } from '../../../app/graphql/operation-fields.js'

const rootFieldNames = (source) => {
  const document = parse(source)
  const [operation] = document.definitions.filter((d) => d.kind === 'OperationDefinition')
  return rootFieldNodes(operation.selectionSet, fragmentsByName(document)).map(
    (field) => field.name.value
  )
}

describe('operation-fields', () => {
  describe('fragmentsByName', () => {
    test('indexes the named fragments in the document', () => {
      const document = parse(`
        query { ...A }
        fragment A on Query { business(sbi: "823456789") { sbi } }
        fragment B on Query { __typename }
      `)

      const fragments = fragmentsByName(document)

      expect(Object.keys(fragments)).toEqual(['A', 'B'])
      expect(fragments.A.kind).toBe('FragmentDefinition')
    })

    test('returns an empty object when there are no fragments', () => {
      expect(fragmentsByName(parse('{ __typename }'))).toEqual({})
    })
  })

  describe('rootFieldNodes', () => {
    test('returns the root fields, but not the fields nested within them', () => {
      expect(
        rootFieldNames('{ business(sbi: "823456789") { sbi info { name } } __typename }')
      ).toEqual(['business', '__typename'])
    })

    test('returns the field name rather than the alias', () => {
      expect(
        rootFieldNames('{ a: business(sbi: "823456789") { sbi } b: __schema { types { name } } }')
      ).toEqual(['business', '__schema'])
    })

    test('follows inline fragments', () => {
      expect(
        rootFieldNames('{ ... { business(sbi: "823456789") { sbi } } __type(name: "X") { name } }')
      ).toEqual(['business', '__type'])
    })

    test('follows fragment spreads, including nested ones', () => {
      expect(
        rootFieldNames(`
          query { ...A }
          fragment A on Query { __schema { queryType { name } } ...B }
          fragment B on Query { ... { customer(crn: "9234567890") { crn } } }
        `)
      ).toEqual(['__schema', 'customer'])
    })

    test('includes fields with @skip or @include, as they could run', () => {
      expect(
        rootFieldNames('{ __typename business(sbi: "823456789") @skip(if: true) { sbi } }')
      ).toEqual(['__typename', 'business'])
    })
  })
})
