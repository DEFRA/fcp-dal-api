import { transformOrganisationToBusiness } from '../../../transformers/rural-payments/business.js'
import { NotFound } from '../../../errors/graphql.js'
import { logger } from '../../../utils/logger.js'

export const Query = {
  async business (__, { sbi }, { dataSources }) {
    const response = await dataSources.ruralPaymentsBusiness.getOrganisationBySBI(sbi)

    if (!response) {
      logger.info(`Business not found for SBI: ${sbi}`)
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
