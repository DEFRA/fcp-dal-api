import { Query } from './query.js'

export const Mutation = {
  async updateBusiness(__, { input }, { dataSources }) {
    await dataSources.ruralPaymentsBusiness.updateBusinessBySBI(input.sbi, input.details)

    return {
      success: true,
      business: {
        sbi: input.sbi
      }
    }
  }
}

export const UpdateBusinessResponse = {
  business({ business: { sbi } }, _, context) {
    return Query.business({}, { sbi }, context)
  }
}
