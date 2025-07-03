import { NotFound } from '../../../errors/graphql.js'
import { DAL_RESOLVERS_BUSINESS_001 } from '../../../logger/codes.js'
import { Query } from './query.js'

export const Mutation = {
  async updateBusinessDetails(__, { input }, { dataSources, logger }) {
    const response = await dataSources.ruralPaymentsBusiness.updateBusinessDetailsBySBI(
      input.sbi,
      input.details
    )

    if (!response) {
      logger.warn('#graphql - business/query - Business not found for SBI', {
        sbi: input.sbi,
        code: DAL_RESOLVERS_BUSINESS_001
      })
      throw new NotFound('Business not found')
    }

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
