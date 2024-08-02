import { VersionOne } from './version-one.js'

export class VersionOneBusiness extends VersionOne {
  async getOrganisationById (id) {
    const organisationResponse = await this.get(`organisation/${id}`)
    return organisationResponse._data
  }

  async getOrganisationBySBI (sbi) {
    const body = JSON.stringify({
      searchFieldType: 'SBI',
      primarySearchPhrase: sbi,
      offset: 0,
      limit: 1
    })

    const organisationResponse = await this.post('organisation/search', {
      body,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = organisationResponse?._data?.pop() || {}

    return this.getOrganisationById(response.id)
  }

  // Retrieve the customers associated with an organisation
  async getOrganisationCustomersByOrganisationId (organisationId) {
    const response = await this.get(`authorisation/organisation/${organisationId}`)
    return response._data
  }

  // Required for role
  // async getAuthorisationByOrganisationId (organisationId) {
  //   const response = await this.get(`/rpp/SitiAgriApi/authorisation/organisation/${organisationId}/authorisation`)
  //   return response.data
  // }
}
