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

const sampleArray = array => {
  const sampleSize = 5
  if (array.length <= sampleSize) {
    return array
  }
  return array.slice(0, sampleSize)
}

export const sampleResponse = response => {
  if (Array.isArray(response)) {
    return sampleArray(response)
  }

  if (Array.isArray(response?._data)) {
    return {
      ...response,
      _data: sampleArray(response._data)
    }
  }

  return response
}
