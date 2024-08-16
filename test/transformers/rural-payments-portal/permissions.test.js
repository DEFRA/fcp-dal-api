import { Permissions } from '../../../app/data-sources/static/permissions.js'
import {
  transformOrganisationAuthorisationToCustomerBusinessPermissionLevel,
  transformPrivilegesListToBusinessCustomerPermissions
} from '../../../app/transformers/rural-payments/permissions.js'
import { sitiAgriAuthorisationOrganisation } from '../../../mocks/fixtures/authorisation.js'
import { organisationPeopleByOrgId } from '../../../mocks/fixtures/organisation.js'

const sitiAgriApiAuthorisationOrganisation = sitiAgriAuthorisationOrganisation({
  organisationId: '5565448'
})

describe('Permissions transformer', () => {
  test('returns null if no match', () => {
    const personPrivileges =
      sitiAgriApiAuthorisationOrganisation.data.personPrivileges
    const result =
      transformOrganisationAuthorisationToCustomerBusinessPermissionLevel(
        personPrivileges[0].personId,
        [],
        personPrivileges
      )
    expect(result).toBeNull()
  })

  test('returns level if  match', () => {
    const personPrivileges =
      sitiAgriApiAuthorisationOrganisation.data.personPrivileges
    const result =
      transformOrganisationAuthorisationToCustomerBusinessPermissionLevel(
        personPrivileges[0].personId,
        [
          {
            level: 'MOCK_LEVEL',
            privilegeNames: ['Full permission - business']
          }
        ],
        personPrivileges
      )
    expect(result).toEqual('MOCK_LEVEL')
  })

  test('returns active permissions', () => {
    const result = transformPrivilegesListToBusinessCustomerPermissions(
      organisationPeopleByOrgId('5565448')._data[0].privileges,
      new Permissions().getPermissionGroups()
    )
    expect(result).toEqual([
      {
        id: 'BASIC_PAYMENT_SCHEME',
        level: 'SUBMIT',
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
    ])
  })
})
