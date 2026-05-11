export const containsAnyResolvedData = (value) => {
  if (value === null || value === undefined) {
    return false
  }

  // If the object is an array (even if it's empty), then treat this as resolved data
  if (Array.isArray(value)) {
    return true
  }

  // non-null primitive
  if (typeof value !== 'object') {
    return true
  }

  // Recursively drill into value, until at least one of the above tests pass
  return Object.values(value).some(containsAnyResolvedData)
}
