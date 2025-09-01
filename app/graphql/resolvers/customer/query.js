export const Query = {
  async customer(__, { crn }, { dataSources }) {
    const personId = await dataSources.ruralPaymentsCustomer.getPersonIdByCRN(crn)
    return { crn, personId }
  }
}
