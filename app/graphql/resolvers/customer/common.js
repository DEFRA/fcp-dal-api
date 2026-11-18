import { MONGO_DB_ERROR_001 } from '../../../logger/codes.js'
import { maskAllButLastFour } from '../../../logger/utils.js'

/**
 * @import { ResolverContext } from '../types.js'
 * @typedef {ResolverContext['dataSources']} DataSources
 */

/**
 * Look up the Rural Payments person id for a customer, and cache it in Mongo
 * @param {string} crn Customer Reference Number: a unique 10-digit number
 * @param {Pick<DataSources, 'mongoCustomer' | 'ruralPaymentsCustomer'>} dataSources
 */
export async function upsertPersonIdByCRN(crn, { mongoCustomer, ruralPaymentsCustomer }) {
  const personId = await ruralPaymentsCustomer.getPersonIdByCRN(crn)

  // NOTE: fire-and-forget insertion to avoid slowing down the request, must use .catch for errors
  mongoCustomer.upsertPersonIdByCRN(crn, personId).catch((err) => {
    ruralPaymentsCustomer.logger.warn(
      `#resolver - Customer - Error storing personId from MongoDB for CRN: ${maskAllButLastFour(crn)}`,
      {
        crn,
        code: MONGO_DB_ERROR_001,
        error: err,
        gatewayType: ruralPaymentsCustomer.gatewayType,
        request: ruralPaymentsCustomer.request
      }
    )
  })

  return personId
}

/**
 * Look up the Rural Payments person id for a customer, from the Mongo cache when possible
 * @param {string} crn Customer Reference Number: a unique 10-digit number
 * @param {Pick<DataSources, 'mongoCustomer' | 'ruralPaymentsCustomer'>} dataSources
 */
export const retrievePersonIdByCRN = async (crn, { mongoCustomer, ruralPaymentsCustomer }) => {
  try {
    return (
      (await mongoCustomer.findPersonIdByCRN(crn)) ?? // check the mongo cache first
      upsertPersonIdByCRN(crn, { mongoCustomer, ruralPaymentsCustomer }) // fallback to API request
    )
  } catch (err) {
    ruralPaymentsCustomer.logger.warn(
      `#resolver - Customer - Error retrieving personId from MongoDB for CRN: ${maskAllButLastFour(crn)}`,
      {
        crn,
        code: MONGO_DB_ERROR_001,
        error: err,
        gatewayType: ruralPaymentsCustomer.gatewayType,
        request: ruralPaymentsCustomer.request
      }
    )

    return ruralPaymentsCustomer.getPersonIdByCRN(crn) // skip insertion attempt on DB error
  }
}
