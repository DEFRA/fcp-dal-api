import { NotFound } from '../../../errors/graphql.js'
import { DAL_RESOLVERS_BUSINESS_001 } from '../../../logger/codes.js'

export const Mutation = {
  async updateBusinessDetails(__, { sbi, businessDetails }, { dataSources, logger }) {
    const response = await dataSources.ruralPaymentsBusiness.updateBusinessDetailsBySBI(
      sbi,
      businessDetails
    )

    if (!response) {
      logger.warn('#graphql - business/query - Business not found for SBI', {
        sbi,
        code: DAL_RESOLVERS_BUSINESS_001
      })
      throw new NotFound('Business not found')
    }

    return businessDetails
  }
}
