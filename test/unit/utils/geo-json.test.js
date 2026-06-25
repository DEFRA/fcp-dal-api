import { isValidGeoJson } from '../../../app/utils/geo-json.js'

describe('isValidGeoJson', () => {
  it('accepts a geometry with coordinates', () => {
    expect(isValidGeoJson({ type: 'Polygon', coordinates: [[[266375.64, 128194.34]]] })).toBe(true)
  })

  it('accepts coordinates with arbitrary nesting or contents', () => {
    expect(isValidGeoJson({ type: 'Point', coordinates: ['anything', { nested: true }] })).toBe(
      true
    )
  })

  it('accepts an empty coordinates array', () => {
    expect(isValidGeoJson({ type: 'Point', coordinates: [] })).toBe(true)
  })

  it.each([
    [undefined, 'undefined value'],
    [null, 'null value'],
    ['Point', 'a string'],
    [42, 'a number'],
    [{ coordinates: [] }, 'missing type'],
    [{ type: '', coordinates: [] }, 'empty type'],
    [{ type: 42, coordinates: [] }, 'non-string type'],
    [{ type: 'Point' }, 'missing coordinates'],
    [{ type: 'Point', coordinates: 'not-an-array' }, 'non-array coordinates']
  ])('rejects %#: %s', (value) => {
    expect(isValidGeoJson(value)).toBe(false)
  })
})
