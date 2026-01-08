import { MONGO_DB_ERROR_001 } from '../../../logger/codes.js'

async function insertPersonIdByCRN(crn, { mongoCustomer, ruralPaymentsCustomer }) {
  const personId = await ruralPaymentsCustomer.getPersonIdByCRN(crn)

  // NOTE: fire-and-forget insertion to avoid slowing down the request, must use .catch for errors
  mongoCustomer.insertPersonIdByCRN(crn, personId).catch((err) => {
    ruralPaymentsCustomer.logger.warn(
      `#resolver - Customer - Error storing personId from MongoDB for CRN: ${crn}`,
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

export const retrievePersonIdByCRN = async (crn, { mongoCustomer, ruralPaymentsCustomer }) => {
  try {
    return (
      (await mongoCustomer.findPersonIdByCRN(crn)) ?? // check the mongo cache first
      insertPersonIdByCRN(crn, { mongoCustomer, ruralPaymentsCustomer }) // fallback to API request
    )
  } catch (err) {
    ruralPaymentsCustomer.logger.warn(
      `#resolver - Customer - Error retrieving personId from MongoDB for CRN: ${crn}`,
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
