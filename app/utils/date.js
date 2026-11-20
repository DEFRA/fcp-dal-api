import { BadRequest } from '../errors/graphql.js'

/**
 * Parses a client-supplied date string and checks that it is a valid date.
 *
 * @param {string} dateString - Date string, ideally in ISO 8601 format (e.g. `2020-01-01`).
 * @returns {Date} The parsed date.
 * @throws {BadRequest} If `dateString` cannot be parsed into a valid date.
 */
export function validateDateInput(dateString) {
  const dateObject = new Date(dateString)
  if (Number.isNaN(dateObject.getTime())) {
    throw new BadRequest(
      `Invalid date format: "${
        dateString
      }" is not a valid date. Date should be supplied in ISO 8601 format, e.g. 2020-01-01`
    )
  }
  return dateObject
}

/**
 * Parses a client-supplied date string and checks that it is valid and before now.
 *
 * @param {string} dateString - Date string, ideally in ISO 8601 format (e.g. `2020-01-01`).
 * @returns {Date} The parsed date.
 * @throws {BadRequest} If `dateString` is not a valid date, or is not before the current time.
 */
export function validatePastDateInput(dateString) {
  const dateObject = validateDateInput(dateString)
  const now = new Date()
  if (dateObject >= now) {
    throw new BadRequest(`Invalid date: "${dateString}" must be in the past.`)
  }
  return dateObject
}

/**
 * Parses a timestamp from an upstream service into a `Date`, returning `null`
 * instead of throwing for missing or invalid values.
 *
 * Some upstream timestamps put a colon instead of a dot before the milliseconds
 * (e.g. `2020-01-01T12:34:56:789`). These are fixed to `12:34:56.789` before parsing.
 *
 * @param {string|number|Date|null|undefined} date - Upstream timestamp (string, epoch milliseconds or `Date`).
 * @returns {Date|null} The parsed date, or `null` if `date` is falsy or invalid.
 */
export const validateUpstreamTimestamp = (date) => {
  if (!date) {
    return null
  }

  const timestamp = new Date(
    typeof date === 'string' ? date.replace(/(\d\d):(\d{3})/, '$1.$2') : date
  )
  return timestamp.toString() === 'Invalid Date' ? null : timestamp
}

/**
 * Converts an upstream timestamp to a full ISO 8601 timestamp string in UTC.
 *
 * @param {string|number|Date|null|undefined} timestamp - Upstream timestamp; see {@link validateUpstreamTimestamp}.
 * @returns {string|null} ISO timestamp (e.g. `2020-01-01T12:34:56.789Z`), or `null` if missing or invalid.
 */
export const validateUpstreamTimestampToISO = (timestamp) =>
  validateUpstreamTimestamp(timestamp)?.toISOString() ?? null // ensure null, not undefined

/**
 * Converts an upstream timestamp to an ISO 8601 date string (UTC date part only).
 *
 * @param {string|number|Date|null|undefined} date - Upstream timestamp; see {@link validateUpstreamTimestamp}.
 * @returns {string|null} ISO date (e.g. `2020-01-01`), or `null` if missing or invalid.
 */
export const validateUpstreamDate = (date) =>
  validateUpstreamTimestamp(date)?.toISOString().split('T')[0] ?? null // ensure null, not undefined

const dateTimeLength = 19

/**
 * Formats a `Date` as `YYYY-MM-DD HH:mm:ss` in UTC, dropping milliseconds and timezone.
 *
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date-time, e.g. `2020-01-01 12:34:56`.
 * @throws {RangeError} If `date` is an invalid `Date`.
 */
export const formatDateAsUtcDateTime = (date) =>
  date.toISOString().substring(0, dateTimeLength).replace('T', ' ')
