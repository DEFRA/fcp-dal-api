import { Permission, Query } from '../../app/graphql/resolvers/permissions/query.js'
import { sitiAgriApiAuthorisationOrganisation } from '../../mocks/fixtures/authorisation.js'

const dataSources = {
  ruralPaymentsPortalApi: {
    getPersonSummaryByPersonId () {
      return [
        {
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
      ]
    },
    getAuthorisationByOrganisationId () {
      return sitiAgriApiAuthorisationOrganisation
    },
    getAuthorisationByOrganisationIdAndPersonId () {
      return sitiAgriApiAuthorisationOrganisation.personPrivileges
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
  const response = await Permission.active({
    privilegeNames: ['Amend - land']
  }, { customerId: 'mockCustomerId', businessId: 'mockBusinessId' }, {
    dataSources
  })
  expect(response).toEqual(true)
})
