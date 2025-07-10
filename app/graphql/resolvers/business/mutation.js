import { Query } from './query.js'

const businessDetailsResolver = async (__, { input }, { dataSources }) => {
  await dataSources.ruralPaymentsBusiness.updateBusinessBySBI(input.sbi, input)

  return {
    success: true,
    business: {
      sbi: input.sbi
    }
  }
}

export const Mutation = {
  updateBusinessName: businessDetailsResolver,
  updateBusinessPhone: businessDetailsResolver,
  updateBusinessEmail: businessDetailsResolver,
  updateBusinessAddress: businessDetailsResolver
}

export const UpdateBusinessResponse = {
  business({ business: { sbi } }, _, context) {
    return Query.business({}, { sbi }, context)
  }
}
