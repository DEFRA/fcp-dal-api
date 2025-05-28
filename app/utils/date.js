import { BadRequest } from '../errors/graphql.js'

export function validateDate(dateString) {
  const dateObject = new Date(dateString)
  if (isNaN(dateObject.getTime())) {
    throw new BadRequest(
      `Invalid date format: "${dateString}" is not a valid date. Date should be supplied in ISO 8601 format, e.g. 2020-01-01`
    )
  }
  return dateObject
}

export function validatePastDate(dateString) {
  const dateObject = validateDate(dateString)
  const now = new Date()
  if (dateObject >= now) {
    throw new BadRequest(`Invalid date: "${dateString}" must be in the past.`)
  }
  return dateObject
}
