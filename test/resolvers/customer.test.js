import { Customer, CustomerBusiness } from '../../app/graphql/resolvers/customer/customer.js'
import { sitiAgriApiAuthorisationOrganisation } from '../../mocks/fixtures/authorisation.js'
import { person } from '../../mocks/fixtures/person.js'

const dataSources = {
  ruralPaymentsPortalApi: {
    getPersonSummaryByPersonId () {
      return [
        {
          id: '4309257',
          name: 'company name',
          sbi: 123123123,
          additionalSbiIds: [],
          confirmed: true,
          lastUpdatedOn: null,
          landConfirmed: null,
          deactivated: false,
          locked: true,
          unreadNotificationCount: 3,
          readNotificationCount: 0
        }
      ]
    },
    getAuthorisationByOrganisationId () {
      return sitiAgriApiAuthorisationOrganisation
    }
  }
}

describe('Customer', () => {
  test('Customer.businesses', async () => {
    const response = await Customer.businesses({ id: 'mockCustomerId', name: 'name', sbi: 123123123 }, undefined, { dataSources })
    expect(response).toEqual([{ id: '4309257', name: 'company name', sbi: 123123123, customerId: 'mockCustomerId' }])
  })
})

describe('CustomerBusiness', () => {
  test('CustomerBusiness.roles', async () => {
    const response = await CustomerBusiness.roles({ id: 'mockBusinessId', customerId: person.id }, undefined, { dataSources })
    expect(response).toEqual(['Business Partner'])
  })

  test('CustomerBusiness.privileges', async () => {
    const response = await CustomerBusiness.privileges({ id: 'mockBusinessId', customerId: person.id }, undefined, { dataSources })
    expect(response).toEqual([
      'Full permission - business',
      'SUBMIT - CS APP - SA',
      'SUBMIT - CS AGREE - SA',
      'Amend - land',
      'Amend - entitlement',
      'Submit - bps',
      'SUBMIT - BPS - SA',
      'AMEND - ENTITLEMENT - SA',
      'AMEND - LAND - SA',
      'Submit - cs app',
      'Submit - cs agree',
      'ELM_APPLICATION_SUBMIT'
    ])
  })
})
