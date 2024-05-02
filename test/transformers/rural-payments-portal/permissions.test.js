import { Permissions } from '../../../app/data-sources/static/permissions.js'
import { transformOrganisationAuthorisationToCustomerBusinessPermissionLevel, transformPrivilegesListToBusinessCustomerPermissions } from '../../../app/transformers/rural-payments-portal/permissions.js'
import { sitiAgriAuthorisationOrganisation } from '../../../mocks/fixtures/authorisation.js'
import { organisationPeopleByOrgId } from '../../../mocks/fixtures/organisation.js'

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

  test('returns active permissions', () => {
    const result = transformPrivilegesListToBusinessCustomerPermissions(organisationPeopleByOrgId()._data[0].privileges, new Permissions().getPermissionGroups())
    expect(result).toEqual([
      {
        id: 'BASIC_PAYMENT_SCHEME',
        level: 'NO_ACCESS',
        name: 'Basic payment scheme (BPS)'
      },
      {
        id: 'BUSINESS_DETAILS',
        level: 'FULL_PERMISSION',
        name: 'Business details'
      },
      {
        id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS',
        level: 'NO_ACCESS',
        name: 'Countryside Stewardship (Agreements)'
      },
      {
        id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS',
        level: 'NO_ACCESS',
        name: 'Countryside Stewardship (Applications)'
      },
      { id: 'ENTITLEMENTS', level: 'AMEND', name: 'Entitlements' },
      {
        id: 'ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS',
        level: 'NO_ACCESS',
        name: 'Environmental Land Management (Applications)'
      },
      { id: 'LAND_DETAILS', level: 'AMEND', name: 'Land details' }
    ]
    )
  })
})
