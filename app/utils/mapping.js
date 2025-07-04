export const transformMapping = (mapping, data) => {
  if (typeof mapping === 'function') {
    return mapping(data)
  }
  if (typeof mapping === 'object') {
    return Object.entries(mapping).reduce((acc, [key, val]) => {
      acc[key] = transformMapping(val, data)
      return acc
    }, {})
  }
  return undefined
}

export const checkUndefinedInMapping = (mapping, data) => {
  if (typeof mapping === 'function') {
    const val = mapping(data)
    return val === undefined
  }
  if (typeof mapping === 'object') {
    return Object.values(mapping).some((val) => checkUndefinedInMapping(val, data))
  }
  return false
}
