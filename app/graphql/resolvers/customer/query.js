async function insertPersonIdByCRN(crn) {
  const personId = await ruralPaymentsCustomer.getPersonIdByCRN(crn)
  await mongoCustomers.insertPersonIdByCRN(crn, personId)
  return personId
}

export const Query = {
  async customer(__, { crn }, { dataSources }) {
    const personId =
      (await dataSources.mongoCustomers.getPersonIdByCRN(crn)) ?? insertPersonIdByCRN(crn)
    return { crn, personId }
  }
}
