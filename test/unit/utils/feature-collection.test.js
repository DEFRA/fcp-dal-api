import { describe, expect, it } from 'vitest'
import { parseFeatureCollectionWithRawCoordinates } from '../../../app/utils/feature-collection.js'
import { RawJSON, stringifyWithRawJSON } from '../../../app/utils/raw-json.js'

const collection = {
  type: 'FeatureCollection',
  bbox: [0, 0, 0, 0],
  features: [
    {
      id: 1,
      type: 'Feature',
      properties: { sheetId: 'SX1234', parcelId: '0001', area: '1.5', note: 'a "quoted" \\ [x]' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [268325.9101, 128882.2099],
            [268324.2001, 128872.7499],
            [268325.9101, 128882.2099]
          ]
        ]
      }
    },
    {
      id: 2,
      type: 'Feature',
      properties: { sheetId: 'SX1234', parcelId: '0002' },
      geometry: {
        type: 'MultiPolygon',
        coordinates: [[[[1, 2]]], [[[3.5, -4e-7]]]]
      }
    },
    { id: 3, type: 'Feature', properties: {}, geometry: null },
    {
      id: 4,
      type: 'Feature',
      properties: null,
      geometry: { type: 'GeometryCollection', geometries: [{ type: 'Point', coordinates: [1, 2] }] }
    }
  ]
}

// Replaces RawJSON with its parsed value, for comparison with JSON.parse
const parseRaw = (value) => JSON.parse(JSON.stringify(value))

describe('parseFeatureCollectionWithRawCoordinates', () => {
  it.each([
    ['compact JSON', JSON.stringify(collection)],
    ['indented JSON', JSON.stringify(collection, null, 2)],
    ['JSON with surrounding whitespace', `\n\t ${JSON.stringify(collection)} \r\n`]
  ])('parses %s to the same value as JSON.parse', (_, text) => {
    expect(parseRaw(parseFeatureCollectionWithRawCoordinates(text))).toEqual(JSON.parse(text))
  })

  it('keeps coordinates as RawJSON slices of the text', () => {
    const text = JSON.stringify(collection, null, 1)
    const { features } = parseFeatureCollectionWithRawCoordinates(text)

    expect(features[0].geometry.type).toBe('Polygon')
    expect(features[0].geometry.coordinates).toBeInstanceOf(RawJSON)
    expect(JSON.parse(features[0].geometry.coordinates.text)).toEqual(
      collection.features[0].geometry.coordinates
    )
    expect(text).toContain(features[0].geometry.coordinates.text)
    expect(features[1].geometry.coordinates).toBeInstanceOf(RawJSON)
    expect(features[2].geometry).toBeNull()
    // only top-level geometry coordinates are kept raw
    expect(features[3].geometry.geometries[0].coordinates).toEqual([1, 2])
  })

  it('round-trips through stringifyWithRawJSON to the same JSON as JSON.stringify', () => {
    const text = JSON.stringify(collection)
    expect(stringifyWithRawJSON(parseFeatureCollectionWithRawCoordinates(text))).toBe(text)
  })

  it('parses keys containing escapes', () => {
    expect(parseFeatureCollectionWithRawCoordinates('{"a\\"b":1,"features":[]}')).toEqual({
      'a"b': 1,
      features: []
    })
  })

  it('parses empty objects and arrays', () => {
    expect(parseFeatureCollectionWithRawCoordinates('{}')).toEqual({})
    expect(
      parseFeatureCollectionWithRawCoordinates('{"features":[{}, null, {"geometry":{}}]}')
    ).toEqual({ features: [{}, null, { geometry: {} }] })
  })

  it('parses a non-array features value with JSON.parse', () => {
    expect(parseFeatureCollectionWithRawCoordinates('{"features":null}')).toEqual({
      features: null
    })
  })

  it.each([
    ['an empty string', ''],
    ['a non-object', '[]'],
    ['an unterminated string', '{"features":[{"id":"abc}]}'],
    ['an unterminated array', '{"features":[{"geometry":{"coordinates":[[1,2]'],
    ['mismatched brackets in coordinates', '{"features":[{"geometry":{"coordinates":[[1,2}]}}]}'],
    ['mismatched braces', '{"features":[{"id":1]]}'],
    ['a missing colon', '{"features" []}'],
    ['a missing comma', '{"a":1 "b":2}'],
    ['a missing value', '{"a":}'],
    ['an unquoted key', '{a:1}'],
    ['a trailing comma in features', '{"features":[{},]}'],
    ['trailing content', '{"features":[]} {}'],
    ['an invalid non-coordinate value', '{"features":[{"id":nope}]}']
  ])('throws for %s', (_, text) => {
    expect(() => parseFeatureCollectionWithRawCoordinates(text)).toThrow(SyntaxError)
  })
})
