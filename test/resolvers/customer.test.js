import { jest } from '@jest/globals'

import pick from 'lodash.pick'
import { Customer, CustomerBusiness } from '../../app/graphql/resolvers/customer/customer.js'
import { sitiAgriAuthorisationOrganisation } from '../../mocks/fixtures/authorisation.js'
import { personById } from '../../mocks/fixtures/person.js'
import { organisationPeopleByOrgId, organisationPersonSummary } from '../../mocks/fixtures/organisation.js'
import { Permissions } from '../../app/data-sources/static/permissions.js'

const orgId = '5565448'
const personId = '5007136'
const personFixture = personById({ id: personId })

const dataSources = {
  ruralPaymentsPortalApi: {
    getCustomerByCRN () {
      return personById({ id: personId })._data
    },
    getAuthorisationByOrganisationId () {
      return sitiAgriAuthorisationOrganisation({ organisationId: orgId }).data
    },
    getPersonSummaryByPersonId: jest.fn(),
    getNotificationsByOrganisationIdAndPersonId: jest.fn(),
    getOrganisationCustomersByOrganisationId () {
      return organisationPeopleByOrgId(orgId)._data
    },
    getPersonBusinessesByPersonId () {
      return organisationPersonSummary({ id: personId })._data
    }
  },
  get versionOneCustomer () {
    return this.ruralPaymentsPortalApi
  },
  get versionOneBusiness () {
    return this.ruralPaymentsPortalApi
  },
  permissions: new Permissions(),
  authenticateDatabase: {
    getAuthenticateQuestionsAnswersByCRN () {
      return {
        CRN: '123',
        Date: 'some date',
        Event: 'some event',
        Location: 'some location'
      }
    }
  }
}

describe('Customer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    dataSources.ruralPaymentsPortalApi.getPersonSummaryByPersonId.mockImplementation(async () => {
      return [
        {
          organisationId: '123',
          name: 'Ratke, Grant and Keebler',
          sbi: 265774479,
          additionalSbiIds: [],
          confirmed: true,
          lastUpdatedOn: null,
          landConfirmed: null,
          deactivated: true,
          locked: false,
          unreadNotificationCount: 3,
          readNotificationCount: 0,
          id: '4309257'
        }
      ]
    })
  })

  test('Customer.info', async () => {
    const response = await Customer.info({ crn: personFixture._data.customerReferenceNumber }, undefined, { dataSources })

    expect(response).toEqual({
      name: {
        title: 'Dr.',
        otherTitle: null,
        first: 'David',
        middle: 'Paul',
        last: 'Paul'
      },
      dateOfBirth: '1947-10-30T03:41:25.385Z',
      phone: { mobile: '1849164778', landline: null, fax: null },
      email: {
        address: 'Selena_Kub@hotmail.com',
        validated: false,
        doNotContact: false
      },
      address: {
        pafOrganisationName: null,
        buildingNumberRange: null,
        buildingName: '853',
        flatName: null,
        street: 'Zulauf Orchard',
        city: 'St. Blanda Heath',
        county: 'Cambridgeshire',
        postalCode: 'YZ72 5MB',
        country: 'United Kingdom',
        uprn: null,
        dependentLocality: null,
        doubleDependentLocality: null,
        typeId: null
      },
      status: { locked: false, confirmed: null, deactivated: false }
    })
  })

  test('Customer.business - returns null if no business', async () => {
    const response = await Customer.business({ crn: personFixture._data.customerReferenceNumber }, { sbi: 107183280 }, { dataSources })
    expect(response).toEqual(null)
  })

  test('Customer.business - returns business', async () => {
    const response = await Customer.business({ crn: personFixture._data.customerReferenceNumber }, { sbi: 107591843 }, { dataSources })
    expect(response).toEqual({
      personId: '5625145',
      name: 'Cliff Spence T/As Abbey Farm',
      customerId: 5007136,
      sbi: 107591843
    })
  })

  test('Customer.businesses', async () => {
    const response = await Customer.businesses({ customerId: '5007136' }, undefined, { dataSources })
    expect(response).toEqual([
      {
        name: 'Cliff Spence T/As Abbey Farm',
        sbi: 107591843,
        businessId: '5625145',
        customerId: 5007136,
        crn: undefined
      }
    ])
  })

  test('Customer.authenticationQuestions', async () => {
    const response = await Customer.authenticationQuestions({ id: 'mockCustomerId' }, undefined, { dataSources })
    expect(response).toEqual({
      isFound: true,
      memorableDate: 'some date',
      memorableEvent: 'some event',
      memorablePlace: 'some location',
      updatedAt: undefined
    })
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

  test.skip('CustomerBusiness.roles', async () => {
    const response = await CustomerBusiness.role({ businessId: '4309257', crn: '0866159801' }, undefined, { dataSources })
    expect(response).toEqual(['Business Partner'])
  })

  test.skip('CustomerBusiness.permissionGroups', async () => {
    const response = await CustomerBusiness.permissionGroups({ businessId: 'mockBusinessId', customerId: 'mockCustomerId' }, undefined, {
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
      const response = await CustomerBusiness.messages({ businessId: '4309257', customerId: 'mockCustomerId' }, {}, { dataSources })
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
        { businessId: '4309257', customerId: 'mockCustomerId' },
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
        { businessId: '123123', customerId: '321321' },
        { showOnlyDeleted: true },
        { dataSources }
      )
      expect(dataSources.ruralPaymentsPortalApi.getNotificationsByOrganisationIdAndPersonId).toHaveBeenCalledWith('123123', '321321', 1, 5)
      expect(response).toEqual([parsedMessages[0]])
    })

    test('pagination', async () => {
      const response = await CustomerBusiness.messages(
        { businessId: '123', customerId: '123' },
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
    const response = await CustomerBusiness.permissionGroups(
      {
        businessId: orgId,
        crn: '1102634220',
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

    expect(response).toEqual([{"id": "BASIC_PAYMENT_SCHEME", "level": "SUBMIT"}, {"id": "BUSINESS_DETAILS", "level": "FULL_PERMISSION"}, {"id": "ENTITLEMENTS", "level": "AMEND"}, {"id": "LAND_DETAILS", "level": "AMEND"}])
  })
})
