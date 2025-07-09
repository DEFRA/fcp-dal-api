export const transformMapping = (mapping, data) => {
  if (typeof mapping === 'function') {
    const result = mapping(data)
    return result === undefined ? undefined : result
  }

  if (typeof mapping === 'object') {
    const transformed = Object.entries(mapping).reduce((acc, [key, val]) => {
      const result = transformMapping(val, data)
      if (result !== undefined) {
        acc[key] = result
      }
      return acc
    }, {})

    // Return undefined if all keys were removed
    return Object.keys(transformed).length > 0 ? transformed : undefined
  }

  return undefined
}
