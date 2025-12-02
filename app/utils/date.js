import { BadRequest } from '../errors/graphql.js'

export function validateDateInput(dateString) {
  const dateObject = new Date(dateString)
  if (isNaN(dateObject.getTime())) {
    throw new BadRequest(
      `Invalid date format: "${
        dateString
      }" is not a valid date. Date should be supplied in ISO 8601 format, e.g. 2020-01-01`
    )
  }
  return dateObject
}

export function validatePastDateInput(dateString) {
  const dateObject = validateDateInput(dateString)
  const now = new Date()
  if (dateObject >= now) {
    throw new BadRequest(`Invalid date: "${dateString}" must be in the past.`)
  }
  return dateObject
}

// returns Date object or null
export const validateUpstreamTimestamp = (date) => {
  if (!date) {
    return null
  }

  const timestamp = new Date(
    typeof date === 'string' ? date.replace(/(\d\d):(\d{3})/, '$1.$2') : date
  )
  return timestamp.toString() === 'Invalid Date' ? null : timestamp
}

// returns ISO Timestamp string or null
export const validateUpstreamTimestampToISO = (timestamp) =>
  validateUpstreamTimestamp(timestamp)?.toISOString() ?? null // ensure null, not undefined

// returns ISO Date string or null
export const validateUpstreamDate = (date) =>
  validateUpstreamTimestamp(date)?.toISOString().split('T')[0] ?? null // ensure null, not undefined
