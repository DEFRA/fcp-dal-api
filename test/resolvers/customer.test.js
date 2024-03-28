import { faker } from '@faker-js/faker/locale/en_GB'
import { jest } from '@jest/globals'

import { Customer, CustomerBusiness, CustomerBusinessPermissionGroup } from '../../app/graphql/resolvers/customer/customer.js'
import { sitiAgriAuthorisationOrganisation } from '../../mocks/fixtures/authorisation.js'
import { createMessage } from '../../mocks/fixtures/messages.js'
import { organisationPersonSummary } from '../../mocks/fixtures/organisation.js'

const authorisationOrganisation = sitiAgriAuthorisationOrganisation({ organisationId: '4309257' })
const personId = authorisationOrganisation.personRoles[0].personId
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
      return authorisationOrganisation
    },
    getAuthorisationByOrganisationIdAndPersonId () {
      return sitiAgriAuthorisationOrganisation().personPrivileges
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
      faker.seed(5109389384975741)
      return [organisationPersonSummary('123')]
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
  beforeEach(() => {
    jest.clearAllMocks()
    dataSources.ruralPaymentsPortalApi.getNotificationsByOrganisationIdAndPersonId.mockImplementation(async () => {
      faker.seed(5109389384975741)
      return [createMessage(), createMessage()]
    })
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
        1
      )
      expect(response).toEqual([
        {
          id: 5875045,
          title: 'Vomica aiunt alveus pectus volo argumentum derelinquo ambulo audacia certe.',
          date: 8247074489993,
          body: '<p>Adversus crastinus suggero caste adhuc vomer accusamus acies iure.</p>',
          read: false,
          archivedAt: null
        }
      ])
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
        1
      )
      expect(response).toEqual([
        {
          id: 5875045,
          title: 'Vomica aiunt alveus pectus volo argumentum derelinquo ambulo audacia certe.',
          date: 8247074489993,
          body: '<p>Adversus crastinus suggero caste adhuc vomer accusamus acies iure.</p>',
          read: false,
          archivedAt: null
        }
      ])
    })

    test('showOnlyDeleted = true', async () => {
      const response = await CustomerBusiness.messages(
        { id: '4309257', customerId: 'mockCustomerId' },
        { showOnlyDeleted: true },
        { dataSources }
      )
      expect(dataSources.ruralPaymentsPortalApi.getNotificationsByOrganisationIdAndPersonId).toHaveBeenCalledWith(
        '4309257',
        'mockCustomerId',
        1,
        1
      )
      expect(response).toEqual([
        {
          id: 2514276,
          title: 'Venia dedecor beatus vinco cultellus clarus terebro voluptate assumenda tot.',
          date: 6333830175753,
          body: '<p>Autem thema blandior verus comprehendo cursim aliquid deleo consequuntur.</p>',
          read: false,
          archivedAt: 2881854478029
        }
      ])
    })

    test('pagination', async () => {
      const response = await CustomerBusiness.messages(
        { id: '123', customerId: '123' },
        { pagination: { perPage: 5, page: 5 } },
        { dataSources }
      )
      expect(dataSources.ruralPaymentsPortalApi.getNotificationsByOrganisationIdAndPersonId).toHaveBeenCalledWith('123', '123', 5, 5)
      expect(response).toEqual([
        {
          id: 5875045,
          title: 'Vomica aiunt alveus pectus volo argumentum derelinquo ambulo audacia certe.',
          date: 8247074489993,
          body: '<p>Adversus crastinus suggero caste adhuc vomer accusamus acies iure.</p>',
          read: false,
          archivedAt: null
        }
      ])
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
