import { transformOrganisationAuthorisationToCustomerBusinessPermissionLevel } from '../../../app/transformers/rural-payments-portal/permissions.js'
import { sitiAgriAuthorisationOrganisation } from '../../../mocks/fixtures/authorisation.js'

const sitiAgriApiAuthorisationOrganisation = sitiAgriAuthorisationOrganisation()

describe('Permissions transformer', () => {
  test('returns null if no match', () => {
    const result = transformOrganisationAuthorisationToCustomerBusinessPermissionLevel(
      [],
      sitiAgriApiAuthorisationOrganisation.data.personPrivileges
    )
    expect(result).toBeNull()
  })

  test('returns level if  match', () => {
    const result = transformOrganisationAuthorisationToCustomerBusinessPermissionLevel(
      [
        {
          level: 'SUBMIT',
          privilegeNames: ['SUBMIT - BPS - SA']
        }
      ],
      sitiAgriApiAuthorisationOrganisation.data.personPrivileges
    )
    expect(result).toEqual('SUBMIT')
  })
})
