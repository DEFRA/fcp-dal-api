import { jest } from '@jest/globals'

import pick from 'lodash.pick'
import { Customer, CustomerBusiness, CustomerBusinessPermissionGroup } from '../../app/graphql/resolvers/customer/customer.js'
import { sitiAgriAuthorisationOrganisation } from '../../mocks/fixtures/authorisation.js'

const authorisationOrganisation = sitiAgriAuthorisationOrganisation({ organisationId: '4309257' })
const personId = authorisationOrganisation.data.personRoles[0].personId
const dataSources = {
  ruralPaymentsPortalApi: {
    getPersonByPersonId () {
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
      return authorisationOrganisation.data
    },
    getAuthorisationByOrganisationIdAndPersonId () {
      return sitiAgriAuthorisationOrganisation().data.personPrivileges
    },
    getPersonSummaryByPersonId: jest.fn(),
    getNotificationsByOrganisationIdAndPersonId: jest.fn()
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

describe('Customer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    dataSources.ruralPaymentsPortalApi.getPersonSummaryByPersonId.mockImplementation(async () => {
      return [
        {
          id: '123',
          name: 'Ratke, Grant and Keebler',
          sbi: 865774479,
          additionalSbiIds: [],
          confirmed: true,
          lastUpdatedOn: null,
          landConfirmed: null,
          deactivated: true,
          locked: false,
          unreadNotificationCount: 3,
          readNotificationCount: 0
        }
      ]
    })
  })

  test('Customer.businesses', async () => {
    const response = await Customer.businesses({ id: 'mockCustomerId', name: 'name', sbi: 123123123 }, undefined, { dataSources })
    expect(response).toEqual([
      {
        id: '123',
        name: 'Ratke, Grant and Keebler',
        sbi: 865774479,
        customerId: 'mockCustomerId'
      }
    ])
  })
})

describe('CustomerBusiness', () => {
  let parsedMessages = []
  beforeEach(() => {
    jest.clearAllMocks()

    const mockMessages = [
      {
        id: 5875045,
        personId: 5824285,
        organisationId: 8008496,
        messageId: 6062814,
        readAt: null,
        archivedAt: 8862388585856,
        archive: null,
        createdAt: 8247074489993,
        title: 'Vomica aiunt alveus pectus volo argumentum derelinquo ambulo audacia certe.',
        body: '<p>Adversus crastinus suggero caste adhuc vomer accusamus acies iure.</p>',
        category: 'OrganisationLevel',
        bespokeNotificationId: null
      },
      {
        id: 2514276,
        personId: 7337791,
        organisationId: 7542172,
        messageId: 9588060,
        readAt: 21000,
        archivedAt: null,
        archive: null,
        createdAt: 8818544780296,
        title: 'Cohibeo conspergo crux ulciscor cubo adamo aufero tepesco odit suppono.',
        body: '<p>Cruentus venia dedecor beatus vinco cultellus clarus.</p>',
        category: 'OrganisationLevel',
        bespokeNotificationId: null
      }
    ]
    parsedMessages = mockMessages.map(mockMessage => ({
      ...pick(mockMessage, ['id', 'title', 'body', 'archivedAt']),
      date: mockMessage.createdAt,
      read: !!mockMessage.readAt
    }))
    dataSources.ruralPaymentsPortalApi.getNotificationsByOrganisationIdAndPersonId.mockImplementation(() => mockMessages)
  })

  test('CustomerBusiness.roles', async () => {
    const response = await CustomerBusiness.roles({ id: '4309257', customerId: personId }, undefined, { dataSources })
    expect(response).toEqual(['Business Partner'])
  })

  test('CustomerBusiness.permissionGroups', async () => {
    const response = await CustomerBusiness.permissionGroups({ id: 'mockBusinessId', customerId: 'mockCustomerId' }, undefined, {
      dataSources
    })

    expect(response).toEqual([
      {
        id: 'MOCK_PERMISSION_GROUP_ID',
        permissions: [
          {
            permissionGroupId: 'MOCK_PERMISSION_GROUP_ID',
            level: 'MOCK_PRIVILEGE_LEVEL',
            functions: [],
            privilegeNames: ['Mock privilege']
          }
        ],
        businessId: 'mockBusinessId',
        customerId: 'mockCustomerId'
      }
    ])
  })

  describe('CustomerBusiness.messages', () => {
    test('no args', async () => {
      const response = await CustomerBusiness.messages({ id: '4309257', customerId: 'mockCustomerId' }, {}, { dataSources })
      expect(dataSources.ruralPaymentsPortalApi.getNotificationsByOrganisationIdAndPersonId).toHaveBeenCalledWith(
        '4309257',
        'mockCustomerId',
        1,
        5
      )
      expect(response).toEqual([parsedMessages[1]])
    })

    test('showOnlyDeleted = false', async () => {
      const response = await CustomerBusiness.messages(
        { id: '4309257', customerId: 'mockCustomerId' },
        { showOnlyDeleted: false },
        { dataSources }
      )
      expect(dataSources.ruralPaymentsPortalApi.getNotificationsByOrganisationIdAndPersonId).toHaveBeenCalledWith(
        '4309257',
        'mockCustomerId',
        1,
        5
      )
      expect(response).toEqual([parsedMessages[1]])
    })

    test('showOnlyDeleted = true', async () => {
      const response = await CustomerBusiness.messages(
        { id: '123123', customerId: '321321' },
        { showOnlyDeleted: true },
        { dataSources }
      )
      expect(dataSources.ruralPaymentsPortalApi.getNotificationsByOrganisationIdAndPersonId).toHaveBeenCalledWith(
        '123123',
        '321321',
        1,
        5
      )
      expect(response).toEqual([parsedMessages[0]])
    })

    test('pagination', async () => {
      const response = await CustomerBusiness.messages(
        { id: '123', customerId: '123' },
        { pagination: { perPage: 5, page: 5 } },
        { dataSources }
      )
      expect(dataSources.ruralPaymentsPortalApi.getNotificationsByOrganisationIdAndPersonId).toHaveBeenCalledWith('123', '123', 5, 5)
      expect(response).toEqual([parsedMessages[1]])
    })
  })
})

describe('CustomerBusinessPermissionGroup', () => {
  test('CustomerBusinessPermissionGroup.level', async () => {
    const response = await CustomerBusinessPermissionGroup.level(
      {
        id: '123',
        businessId: '123',
        customerId: '123',
        permissions: [
          {
            level: 'MOCK_PRIVILEGE_LEVEL',
            functions: [],
            privilegeNames: ['Full permission - business']
          }
        ]
      },
      undefined,
      { dataSources }
    )
    expect(response).toEqual('MOCK_PRIVILEGE_LEVEL')
  })
})
