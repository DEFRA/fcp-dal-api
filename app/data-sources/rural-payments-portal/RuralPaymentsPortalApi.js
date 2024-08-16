import { RuralPaymentsPortalBase } from './RuralPaymentsPortalBase.js'

export class RuralPaymentsPortalApi extends RuralPaymentsPortalBase {
  async getApplicationsCountrysideStewardship (organisationId) {
    const response = await this.get(
      `injected-screens-mt/api/organisation/${organisationId}/applications/appslist`
    )
    return response._data
  }

  getParcelsSummaryByOrganisationId (organisationId) {
    return this.get(
      `viewland/lms/lms/organisation/${organisationId}/parcels/bo-summary`
    )
  }
}
