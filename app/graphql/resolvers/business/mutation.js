import { Query } from './query.js'

const businessDetailsResolver = async (__, { sbi, input }, { dataSources }) => {
  await dataSources.ruralPaymentsBusiness.updateBusinessBySBI(sbi, input)

  return {
    success: true,
    business: {
      sbi: sbi
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
