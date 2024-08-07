import { RuralPaymentsPortalBase } from './RuralPaymentsPortalBase.js'

export class RuralPaymentsPortalApi extends RuralPaymentsPortalBase {
  async getCustomerByCRN (crn) {
    const body = JSON.stringify({
      searchFieldType: 'CUSTOMER_REFERENCE',
      primarySearchPhrase: crn,
      offset: 0,
      limit: 1
    })

    const customerResponse = await this.post('api/person/search', {
      body,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const response = customerResponse._data.pop() || {}

    return this.getPersonByPersonId(response.id)
  }

  async getOrganisationById (id) {
    const organisationResponse = await this.get(`api/organisation/${id}`)
    return organisationResponse._data
  }

  async getOrganisationBySBI (sbi) {
    const body = JSON.stringify({
      searchFieldType: 'SBI',
      primarySearchPhrase: sbi,
      offset: 0,
      limit: 1
    })

    const organisationResponse = await this.post('api/organisation/search', {
      body,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = organisationResponse?._data?.pop() || {}

    return this.getOrganisationById(response.id)
  }

  async getPersonSummaryByPersonId (personId, sbi) {
    const personBusinessSummaries = await this.get(
      `api/organisation/person/${personId}/summary?order=asc&page=1&page-size=20&search=&sort-by=name&withNotifications=true&organisationId=${sbi}`
    )

    for (const personBusinessSummary of personBusinessSummaries._data) {
      const organisationDetail = await this.getOrganisationBySBI(personBusinessSummary.sbi)
      personBusinessSummary.organisationId = organisationDetail.id
    }

    return personBusinessSummaries._data
  }

  async getOrganisationCustomersByOrganisationId (organisationId) {
    const response = await this.get(`api/authorisation/organisation/${organisationId}`)
    return response._data
  }

  async getPersonByPersonId (personId) {
    const response = await this.get(`api/person/${personId}`)
    return response._data
  }

  async getApplicationsCountrysideStewardship (organisationId) {
    const response = await this.get(`injected-screens-mt/api/organisation/${organisationId}/applications/appslist`)
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

  async getOrganisationCPHCollectionBySBI (organisationId) {
    const response = await this.get(`SitiAgriApi/cph/organisation/${organisationId}/cph-numbers`)
    return response.data
  }

  async getOrganisationCPHInfoBySBIAndCPHNumber (organisationId, cphNumber) {
    const response = await this.get(`SitiAgriApi/cph/organisation/${organisationId}/cph-numbers/${encodeURIComponent(cphNumber)}`)
    return response.data
  }

  async getNotificationsByOrganisationIdAndPersonId (organisationId, personId, page, size) {
    const response = await this.get('/rpp/notifications', {
      params: {
        personId,
        organisationId,
        filter: '',
        page,
        size
      }
    })

    return response.notifications
  }

  async getAuthorisationByOrganisationId (organisationId) {
    const response = await this.get(`/rpp/SitiAgriApi/authorisation/organisation/${organisationId}/authorisation`)
    return response.data
  }
}
