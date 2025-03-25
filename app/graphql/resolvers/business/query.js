import { NotFound } from '../../../errors/graphql.js'
import { DAL_RESOLVERS_BUSINESS_001 } from '../../../logger/codes.js'
import { transformOrganisationToBusiness } from '../../../transformers/rural-payments/business.js'

export const Query = {
  async business(__, { sbi }, { dataSources, logger }) {
    const response = await dataSources.ruralPaymentsBusiness.getOrganisationBySBI(sbi)

    if (!response) {
      logger.warn('#graphql - business/query - Business not found for SBI', {
        sbi,
        event: DAL_RESOLVERS_BUSINESS_001
      })
      throw new NotFound('Business not found')
    }

    const business = transformOrganisationToBusiness(response)
    return {
      sbi,
      land: { sbi },
      ...business
    }
  }
}
