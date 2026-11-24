import { parse } from 'graphql'
import { describe, expect, it } from 'vitest'
import { isFieldRequested } from '../../../app/utils/graphql.js'

// Builds a minimal resolver info for the first field selected under `business`
const infoFor = (query) => {
  const document = parse(query)
  const operation = document.definitions.find((d) => d.kind === 'OperationDefinition')
  const fragments = Object.fromEntries(
    document.definitions
      .filter((d) => d.kind === 'FragmentDefinition')
      .map((fragment) => [fragment.name.value, fragment])
  )
  const parcels = operation.selectionSet.selections[0]
  return { fieldNodes: [parcels], fragments }
}

describe('isFieldRequested', () => {
  it('returns false without info', () => {
    expect(isFieldRequested(undefined, 'geometry')).toBe(false)
  })

  it('returns false for a field without a selection set', () => {
    expect(isFieldRequested({ fieldNodes: [{}] }, 'geometry')).toBe(false)
  })

  it('detects a directly selected field', () => {
    expect(isFieldRequested(infoFor('{ parcels { id geometry } }'), 'geometry')).toBe(true)
  })

  it('returns false when the field is not selected', () => {
    expect(isFieldRequested(infoFor('{ parcels { id } }'), 'geometry')).toBe(false)
  })

  it('does not match a nested field of the same name', () => {
    expect(isFieldRequested(infoFor('{ parcels { covers { geometry } } }'), 'geometry')).toBe(false)
  })

  it('detects an aliased field', () => {
    expect(isFieldRequested(infoFor('{ parcels { boundary: geometry } }'), 'geometry')).toBe(true)
  })

  it('detects a field within an inline fragment', () => {
    expect(
      isFieldRequested(
        infoFor('{ parcels { ... on BusinessLandParcel { geometry } } }'),
        'geometry'
      )
    ).toBe(true)
  })

  it('detects a field within a nested fragment spread', () => {
    const query = `
      { parcels { ...Outer } }
      fragment Outer on BusinessLandParcel { id ...Inner }
      fragment Inner on BusinessLandParcel { geometry }
    `
    expect(isFieldRequested(infoFor(query), 'geometry')).toBe(true)
  })

  it('returns false for an unknown fragment spread', () => {
    expect(isFieldRequested({ ...infoFor('{ parcels { ...Missing } }') }, 'geometry')).toBe(false)
  })
})
