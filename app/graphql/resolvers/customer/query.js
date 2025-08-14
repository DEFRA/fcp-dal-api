export const Query = {
  async customer({ crn }, __, { dataSources }) {
    const personId = await dataSources.ruralPaymentsCustomer.getPersonIdByCRN(crn)
    return { crn, personId }
  }
}
