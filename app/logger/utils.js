/**
 * Recursively convert an object to a JSON string, removing circular references,
 * extracting useful information from Error objects, and removing Winston-specific
 * properties.
 */
export const jsonStringify = (obj) => {
  delete obj.level
  delete obj.message

  // Log error instances as objects
  if (obj.error) {
    const error = {
      message: obj.error.message,
      stack: obj.error?.stack?.split('\n')
    }
    if (obj.error?.request) {
      error.request = {
        headers: obj.error?.request?.headers,
        data: obj.error?.request?.data
      }
    }
    if (obj.error?.response) {
      error.response = {
        status: obj.error?.response?.statusCode,
        headers: obj.error?.response?.headers,
        body: obj.error?.response?.body
      }
    }
    obj.error = error
  }

  // Prevent logging circular references
  const cache = new Set()
  return JSON.stringify(
    obj,
    (_, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          return null
        }
        cache.add(value)
      }
      return value
    },
    4
  )
}

const sampleArray = (array, sampleSize = 5) => {
  if (!Array.isArray(array)) {
    return array
  }
  if (array.length <= sampleSize) {
    return array
  }
  return array.slice(0, sampleSize)
}

export const sampleResponse = (response) => {
  const processItem = (objOrArray) => {
    if (objOrArray == null) {
      return objOrArray
    }

    if (objOrArray && typeof objOrArray === 'object' && !Array.isArray(objOrArray)) {
      const processed = { ...objOrArray } // Create copy to avoid mutation
      for (const key in processed) {
        processed[key] = processItem(processed[key])
      }
      return processed
    } else if (Array.isArray(objOrArray)) {
      const sampled = sampleArray(objOrArray) // Don't mutate input array
      return sampled.map(processItem)
    }

    return objOrArray
  }

  let data = response
  try {
    // Only try to parse if response is a string
    if (typeof response === 'string') {
      data = JSON.parse(data)
    }
  } catch (error) {
    // Not JSON
  }

  return processItem(data)
}
