import { VersionOne } from './version-one.js'

export class VersionOneCustomer extends VersionOne {
  async getCustomerByCRN (crn) {
    const body = JSON.stringify({
      searchFieldType: 'CUSTOMER_REFERENCE',
      primarySearchPhrase: crn,
      offset: 0,
      limit: 1
    })

    const customerResponse = await this.post('person/search', {
      body,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const response = customerResponse._data.pop() || {}

    return this.getPersonByPersonId(response.id)
  }

  async getPersonByPersonId (personId) {
    const response = await this.get(`person/${personId}/summary`)
    return response._data
  }
}
