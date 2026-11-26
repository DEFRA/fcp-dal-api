// Numbers are masked too (RP ids such as personIds and orgIds are often numbers); values of four
// characters or fewer, and anything other than a string or number, are returned unchanged
export const maskAllButLastFour = (value) => {
  const text = typeof value === 'number' ? `${value}` : value
  if (typeof text !== 'string' || text.length <= 4) return value
  return '*'.repeat(text.length - 4) + text.slice(-4)
}

// A standalone run of 7-8 digits (orgId), 9 digits (SBI) or 10 digits (CRN/FRN). The lookarounds
// stop it matching part of a longer number, a decimal (e.g. 1.823456789), an alphanumeric ID, or
// the first segment of a UUID (8 characters followed by "-xxxx-", which can be all digits).
// Based on the pattern the fcp-sfd-core check-synthetic-ids CI action uses for SBIs and CRNs,
// widened to 7-8 digits for orgIds.
// There are no nested quantifiers, so matching is linear in the length of the text.
const REFERENCE_NUMBER_REGEX =
  /(?<![0-9A-Za-z]|\d\.)(\d{7,10})(?![0-9A-Za-z]|\.\d|-[0-9A-Fa-f]{4}-)/g

/**
 * Masks every orgId/SBI/CRN/FRN-like number in free text to its last four digits, for text that is
 * logged as-is (log and error messages, stack traces). It can't tell an ID from any other 7 to 10
 * digit number (e.g. a compact date such as 20241119), so those are masked too. IDs shorter than 7
 * digits are not caught.
 *
 * @example
 * maskReferenceNumbers('organisation 5565448 not found for SBI 823456789')
 * // => 'organisation ***5448 not found for SBI *****6789'
 *
 * @param {*} text the text to mask
 * @returns {*} the masked text, or the value unchanged if it is not a string
 */
export const maskReferenceNumbers = (text) =>
  typeof text === 'string' ? text.replace(REFERENCE_NUMBER_REGEX, maskAllButLastFour) : text

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
