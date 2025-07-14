export const transformMapping = (mapping, data) => {
  if (typeof mapping === 'function') {
    const result = mapping(data)
    return result === undefined ? undefined : result
  } else if (typeof mapping === 'object') {
    const transformed = Object.entries(mapping).reduce((acc, [key, val]) => {
      const result = transformMapping(val, data)
      if (result !== undefined) {
        acc[key] = result
      }
      return acc
    }, {})

    return transformed
  } else {
    return undefined
  }
}
