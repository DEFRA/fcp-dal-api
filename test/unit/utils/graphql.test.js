import { isFieldRequested } from '../../../app/utils/graphql.js'

describe('isFieldRequested', () => {
  const buildInfo = (fields) => ({
    fieldNodes: [
      {
        selectionSet: {
          selections: fields.map((name) => ({ kind: 'Field', name: { value: name } }))
        }
      }
    ]
  })

  test('returns true when the field is in the selection set', () => {
    expect(isFieldRequested(buildInfo(['id', 'geometry']), 'geometry')).toBe(true)
  })

  test('returns false when the field is not in the selection set', () => {
    expect(isFieldRequested(buildInfo(['id', 'name']), 'geometry')).toBe(false)
  })

  test('returns false when there is no selection set', () => {
    expect(isFieldRequested({ fieldNodes: [{}] }, 'geometry')).toBe(false)
  })
})
