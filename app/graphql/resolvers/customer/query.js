import { retrievePersonIdByCRN } from './common.js'

export const Query = {
  async customer(__, { crn }, { dataSources }) {
    const personId = await retrievePersonIdByCRN(crn, dataSources)

    return { crn, personId }
  },

  async customerEmail(__, { emailAddress }, { dataSources }) {
    const results =
      await dataSources.ruralPaymentsCustomer.customerEmailExistsByEmailAddress(emailAddress)

    return {
      emailAddress,
      addressInUse: results.emailDuplicated
    }
  }
}
