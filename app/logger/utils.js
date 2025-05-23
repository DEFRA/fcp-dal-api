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
