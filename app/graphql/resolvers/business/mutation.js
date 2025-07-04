import { Query } from './query.js'

export const Mutation = {
  async updateBusinessDetails(__, { input }, { dataSources }) {
    await dataSources.ruralPaymentsBusiness.updateBusinessDetailsBySBI(input.sbi, input.details)

    return {
      success: true,
      business: {
        sbi: input.sbi
      }
    }
  }
}

export const UpdateBusinessDetailsResponse = {
  business({ business: { sbi } }, _, context) {
    return Query.business({}, { sbi }, context)
  }
}
