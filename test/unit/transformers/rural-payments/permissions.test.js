import { transformOrganisationAuthorisationToCustomerBusinessPermissionLevel } from '../../../../app/transformers/rural-payments/permissions.js'
import { organisationPeopleByOrgId } from '../../../../mocks/fixtures/organisation.js'

const orgId = '5565448'
const orgCustomers = organisationPeopleByOrgId(orgId)._data

describe('Permissions transformer', () => {
  test('returns null if no match', () => {
    const result = transformOrganisationAuthorisationToCustomerBusinessPermissionLevel(
      orgCustomers[0].id,
      [],
      orgCustomers
    )
    expect(result).toBeNull()
  })

  test('returns level if  match', () => {
    const result = transformOrganisationAuthorisationToCustomerBusinessPermissionLevel(
      orgCustomers[0].id,
      [
        {
          level: 'MOCK_LEVEL',
          privilegeNames: ['Full permission - business']
        }
      ],
      orgCustomers
    )
    expect(result).toEqual('MOCK_LEVEL')
  })
})
