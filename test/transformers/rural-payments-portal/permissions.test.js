import { transformOrganisationAuthorisationToCustomerBusinessPermissionLevel } from '../../../app/transformers/rural-payments-portal/permissions.js'
import { sitiAgriApiAuthorisationOrganisation } from '../../../mocks/fixtures/authorisation.js'

describe('Permissions transformer', () => {
  test('returns null if no match', () => {
    const result =
       transformOrganisationAuthorisationToCustomerBusinessPermissionLevel(
         [],
         sitiAgriApiAuthorisationOrganisation.personPrivileges
       )
    expect(result).toBeNull()
  })

  test('returns level if  match', () => {
    const result =
       transformOrganisationAuthorisationToCustomerBusinessPermissionLevel(
         [
           {
             level: 'SUBMIT',
             privilegeNames: ['SUBMIT - BPS - SA']
           }
         ],
         sitiAgriApiAuthorisationOrganisation.personPrivileges
       )
    expect(result).toEqual('SUBMIT')
  })
})
