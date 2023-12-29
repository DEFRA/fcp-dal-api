import {
  transformPersonRolesToCustomerAuthorisedBusinessesRoles,
  transformPersonPrivilegesToCustomerAuthorisedBusinessesPrivileges,
  transformPersonSummaryToCustomerAuthorisedBusinesses
} from '../../../app/transformers/rural-payments-portal/customer.js'
import { sitiAgriApiAuthorisationOrganisation } from '../../../mocks/fixtures/authorisation.js'
import { person } from '../../../mocks/fixtures/person.js'

const mockOrganisationPersonSummary = {
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

describe('Customer transformer', () => {
  test('transformPersonRolesToCustomerAuthorisedBusinessesRoles', () => {
    const result = transformPersonSummaryToCustomerAuthorisedBusinesses('customerId', [mockOrganisationPersonSummary])
    expect(result).toEqual([{ customerId: 'customerId', id: '4309257', name: 'company name', sbi: 123123123 }])
  })

  test('transformPersonRolesToCustomerAuthorisedBusinessesRoles', () => {
    const result = transformPersonRolesToCustomerAuthorisedBusinessesRoles(person.id, sitiAgriApiAuthorisationOrganisation.personRoles)
    expect(result).toEqual(['Business Partner'])
  })

  test('transformPersonPrivilegesToCustomerAuthorisedBusinessesPrivileges', () => {
    const result = transformPersonPrivilegesToCustomerAuthorisedBusinessesPrivileges(
      person.id,
      sitiAgriApiAuthorisationOrganisation.personPrivileges
    )
    expect(result).toEqual([
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
