import { transformOrganisationCSApplicationToBusinessApplications } from '../../../transformers/rural-payments-portal/applications-cs.js'
import { transformOrganisationToBusiness } from '../../../transformers/rural-payments-portal/business.js'

export const Query = {
  async business (__, { sbi }, { dataSources }) {
    const response = await dataSources.ruralPaymentsPortalApi.getOrganisationBySBI(sbi)
    const business = transformOrganisationToBusiness(response)
    return {
      sbi,
      land: { sbi },
      ...business
    }
  },

  async businessApplications (_, { sbi }, { dataSources }) {
    const response = await dataSources.ruralPaymentsPortalApi.getApplicationsCountrysideStewardshipBySbi(sbi)

    return transformOrganisationCSApplicationToBusinessApplications(response.applications)
  }
}
