import { NotFound } from '../../../errors/graphql.js'
import { DAL_RESOLVERS_BUSINESS_001 } from '../../../logger/codes.js'
import { transformOrganisationToBusiness } from '../../../transformers/rural-payments/business.js'

export const Mutation = {
  async updateBusinessDetails(__, { sbi }, { dataSources, logger }) {
    const response = await dataSources.ruralPaymentsBusiness.updateOrganisationBySBI(sbi)

    if (!response) {
      logger.warn('#graphql - business/query - Business not found for SBI', {
        sbi,
        code: DAL_RESOLVERS_BUSINESS_001
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
