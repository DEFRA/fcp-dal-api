import { RuralPaymentsPortalBase } from './RuralPaymentsPortalBase.js'

export class RuralPaymentsPortalApi extends RuralPaymentsPortalBase {
  async getCustomerByCRN (crn) {
    const customerResponse = await this.get(`api/person/${crn}`)
    return customerResponse._data
  }

  async getOrganisationBySBI (sbi) {
    const organisationResponse = await this.get(`api/organisation/${sbi}`)
    return organisationResponse._data
  }

  async getPersonSummaryByPersonId (personId) {
    const response = await this.get(`api/organisation/person/${personId}/summary?order=asc&page=1&page-size=20&search=&sort-by=name&withNotifications=true`)
    return response._data
  }

  async getAuthorisationByOrganisationId (organisationId) {
    const response = await this.get(`SitiAgriApi/authorisation/organisation/${organisationId}/authorisation`)
    return response.data
  }

  async getApplicationsCountrysideStewardshipBySbi (sbi) {
    const response = await this.get(`injected-screens-mt/api/organisation/${sbi}/applications/appslist`)
    return response._data
  }

  getParcelsByOrganisationId (organisationId) {
    return this.get(`/rpp/viewland/lms/lms/organisation/${organisationId}/parcels`)
  }

  getCoversByOrganisationId (organisationId) {
    return this.get(`/rpp/viewland/lms/lms/organisation/${organisationId}/land-covers`)
  }

  getParcelsSummaryByOrganisationId (organisationId) {
    return this.get(`viewland/lms/lms/organisation/${organisationId}/parcels/bo-summary`)
  }

  getCoversSummaryByOrganisationId (organisationId) {
    return this.get(`viewland/lms/lms/organisation/${organisationId}/covers-summary`)
  }

  async getOrganisationCPHCollectionBySBI (sbi) {
    const response = await this.get(`SitiAgriApi/cph/organisation/${sbi}/cph-numbers`)
    return response.data
  }

  async getOrganisationCPHInfoBySBIAndCPHNumber (sbi, cphNumber) {
    const response = await this.get(`SitiAgriApi/cph/organisation/${sbi}/cph-numbers/${cphNumber}`)
    return response.data
  }
}
