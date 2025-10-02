async function insertPersonIdByCRN(crn, { MongoCustomer, ruralPaymentsCustomer }) {
  const personId = await ruralPaymentsCustomer.getPersonIdByCRN(crn)
  await MongoCustomer.insertPersonIdByCRN(crn, personId)
  return personId
}

export const Query = {
  async customer(__, { crn }, { dataSources }) {
    const personId =
      (await dataSources.mongoCustomer.getPersonIdByCRN(crn)) ??
      insertPersonIdByCRN(crn, dataSources)
    return { crn, personId }
  }
}
