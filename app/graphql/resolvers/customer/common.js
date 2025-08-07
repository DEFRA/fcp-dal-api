export const getPersonId = async (dataSources, crn, gatewayType) => {
  if (gatewayType == 'internal') {
    return dataSources.ruralPaymentsCustomer.getPersonIdByCRN(crn)
  } else {
    return dataSources.ruralPaymentsCustomer.getExternalPersonId()
  }
}
