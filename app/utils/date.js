import { BadRequest } from '../errors/graphql.js'

export const validateDate = (dateString) => {
  const dateObject = new Date(dateString)
  if (isNaN(dateObject.getTime())) {
    throw new BadRequest(
      `Invalid date format: "${dateString}" is not a valid date. Date should be supplied in ISO 8601 format, e.g. 2020-01-01`
    )
  }
  return dateObject
}
