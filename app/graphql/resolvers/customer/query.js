import { NotFound } from '../../../errors/graphql.js'
import { logger } from '../../../utils/logger.js'

export const Query = {
  async customer (__, { crn }, { dataSources }) {
    const response = await dataSources.ruralPaymentsCustomer.getCustomerByCRN(crn)

    if (!response) {
      logger.info(`Customer not found for CRN: ${crn}`)
      throw new NotFound('Customer not found')
    }

    return {
      crn,
      personId: response.id
    }
  }
}
