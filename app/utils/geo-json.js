// Validates against the upstream LMS API's GeoJsonGeometry contract, not the full GeoJSON
// spec: the upstream OpenAPI schema is marked `x-schema-incomplete: true` and only
// commits to `{ type: string, coordinates: array }`, leaving the array contents unconstrained
// ("items: {}"). Validating any more strictly than that risks rejecting genuine upstream data.
export function isValidGeoJson(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.type === 'string' &&
    value.type.length > 0 &&
    Array.isArray(value.coordinates)
  )
}
