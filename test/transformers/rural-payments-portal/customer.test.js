import {
  transformPersonRolesToCustomerAuthorisedBusinessesRoles,
  transformPersonPrivilegesToCustomerAuthorisedBusinessesPrivileges,
  transformPersonSummaryToCustomerAuthorisedBusinesses
} from '../../../app/transformers/rural-payments-portal/customer.js'
import { sitiAgriApiAuthorisationOrganisation } from '../../../mocks/fixtures/authorisation.js'
import { organisationPersonSummary } from '../../../mocks/fixtures/organisation-person-summary.js'
import { person } from '../../../mocks/fixtures/person.js'

describe('Customer transformer', () => {
  test('transformPersonRolesToCustomerAuthorisedBusinessesRoles', () => {
    const result = transformPersonSummaryToCustomerAuthorisedBusinesses('customerId', [organisationPersonSummary])
    expect(result).toEqual([{ customerId: 'customerId', id: '4309257' }])
  })

  test('transformPersonRolesToCustomerAuthorisedBusinessesRoles', () => {
    const result = transformPersonRolesToCustomerAuthorisedBusinessesRoles(person.id, sitiAgriApiAuthorisationOrganisation.personRoles)
    expect(result).toEqual(['Business Partner'])
  })

  test('transformPersonPrivilegesToCustomerAuthorisedBusinessesPrivileges', () => {
    const result = transformPersonPrivilegesToCustomerAuthorisedBusinessesPrivileges(person.id, sitiAgriApiAuthorisationOrganisation.personPrivileges)
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
