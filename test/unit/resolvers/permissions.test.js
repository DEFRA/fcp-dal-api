import { Permission, Query } from '../../../app/graphql/resolvers/permissions/query.js'
import { organisationBySbi, organisationPeopleByOrgId } from '../../fixtures/organisation.js'
import { personById } from '../../fixtures/person.js'

const dataSources = {
  ruralPaymentsBusiness: {
    getOrganisationCustomersByOrganisationId(organisationId) {
      return organisationPeopleByOrgId(organisationId)._data
    },
    getOrganisationBySBI(sbi) {
      return organisationBySbi(sbi)._data[0]
    }
  },
  ruralPaymentsCustomer: {
    getCustomerByCRN() {
      return personById({ id: '5263421' })._data
    }
  },
  permissions: {
    getPermissionGroups() {
      return [
        {
          id: 'MOCK_PERMISSION_GROUP_ID',
          permissions: [
            {
              permissionGroupId: 'MOCK_PERMISSION_GROUP_ID',
              level: 'MOCK_PRIVILEGE_LEVEL',
              functions: [],
              privilegeNames: ['Mock privilege']
            }
          ]
        }
      ]
    }
  }
}

test('Query.permissionGroups', async () => {
  const response = await Query.permissionGroups(undefined, undefined, {
    dataSources
  })
  expect(response).toEqual([
    {
      id: 'MOCK_PERMISSION_GROUP_ID',
      permissions: [
        {
          functions: [],
          level: 'MOCK_PRIVILEGE_LEVEL',
          permissionGroupId: 'MOCK_PERMISSION_GROUP_ID',
          privilegeNames: ['Mock privilege']
        }
      ]
    }
  ])
})

test('Permission.active', async () => {
  const response = await Permission.active(
    {
      privilegeNames: ['Amend - land']
    },
    { crn: '1102634220', sbi: '107183280' },
    {
      dataSources
    }
  )
  expect(response).toEqual(true)
})
