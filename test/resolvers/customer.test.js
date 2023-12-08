import { Customer, CustomerBusiness } from '../../app/graphql/resolvers/customer/customer.js'
import { sitiAgriApiAuthorisationOrganisation } from '../../mocks/fixtures/authorisation.js'
import { organisationPersonSummary } from '../../mocks/fixtures/organisation-person-summary.js'
import { person } from '../../mocks/fixtures/person.js'

const dataSources = {
  ruralPaymentsPortalApi: {
    getPersonSummaryByPersonId () {
      return [organisationPersonSummary]
    },
    getAuthorisationByOrganisationId () {
      return sitiAgriApiAuthorisationOrganisation
    }
  }
}

describe('Customer', () => {
  test('Customer.businesses', async () => {
    const response = await Customer.businesses({ id: 'mockCustomerId' }, undefined, { dataSources })
    expect(response).toEqual([{ id: '4309257', customerId: 'mockCustomerId' }])
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
