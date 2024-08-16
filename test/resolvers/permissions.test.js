import {
  Permission,
  Query
} from '../../app/graphql/resolvers/permissions/query.js'
import { sitiAgriAuthorisationOrganisation } from '../../mocks/fixtures/authorisation.js'

const dataSources = {
  ruralPaymentsBusiness: {
    getAuthorisationByOrganisationId (organisationId) {
      return sitiAgriAuthorisationOrganisation({ organisationId }).data
    }
  },
  permissions: {
    getPermissionGroups () {
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
    { customerId: '5263421', businessId: '5565448' },
    {
      dataSources
    }
  )
  expect(response).toEqual(true)
})
