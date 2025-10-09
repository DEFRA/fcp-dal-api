async function insertPersonIdByCRN(crn, { mongoCustomer, ruralPaymentsCustomer }) {
  const personId = await ruralPaymentsCustomer.getPersonIdByCRN(crn)
  await mongoCustomer.insertPersonIdByCRN(crn, personId)
  return personId
}

export const retrievePersonIdByCRN = async (crn, { mongoCustomer, ruralPaymentsCustomer }) => {
  return (
    (await mongoCustomer.getPersonIdByCRN(crn)) ??
    insertPersonIdByCRN(crn, { mongoCustomer, ruralPaymentsCustomer })
  )
}
