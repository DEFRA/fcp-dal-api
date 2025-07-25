import { jest } from '@jest/globals'

import { Permissions } from '../../../app/data-sources/static/permissions.js'
import { Customer, CustomerBusiness } from '../../../app/graphql/resolvers/customer/customer.js'
import { organisationPeopleByOrgId } from '../../fixtures/organisation.js'
import { buildPermissionsFromIdsAndLevels } from '../../test-helpers/permissions.js'

const orgId = '5565448'
const personFixture = {
  id: 11111111,
  title: 'Mrs.',
  otherTitle: 'I',
  firstName: 'Lauren',
  middleName: 'Daryl',
  lastName: 'Sanford',
  dateOfBirth: 108901578380,
  landline: '055 4582 4488',
  mobile: '056 8967 5108',
  email: 'lauren.sanford@immaculate-shark.info',
  doNotContact: false,
  emailValidated: false,
  address: {
    address1: '65',
    address2: '1 McCullough Path',
    address3: 'Newton Ratkedon',
    address4: 'MS9 8BJ',
    address5: 'North Macedonia',
    pafOrganisationName: null,
    flatName: null,
    buildingNumberRange: null,
    buildingName: null,
    street: null,
    city: 'Newton Bruen',
    county: null,
    postalCode: 'TC2 8KP',
    country: 'Wales',
    uprn: '790214962932',
    dependentLocality: null,
    doubleDependentLocality: null,
    addressTypeId: null
  },
  locked: false,
  confirmed: false,
  customerReferenceNumber: 'crn-11111111',
  personalIdentifiers: ['8568845789', '370030956', '7899566034'],
  deactivated: false
}
const personBusinessesFixture = [
  {
    id: '5625145',
    name: 'Cliff Spence T/As Abbey Farm',
    sbi: 107591843,
    additionalSbiIds: [],
    confirmed: true,
    lastUpdatedOn: null,
    landConfirmed: null,
    deactivated: false,
    locked: false
  }
]

const dataSources = {
  ruralPaymentsCustomer: {
    getCustomerByCRN() {
      return personFixture
    },
    getPersonBusinessesByPersonId() {
      return personBusinessesFixture
    },
    getNotificationsByOrganisationIdAndPersonId: jest.fn(),
    getAuthenticateAnswersByCRN() {
      return {
        memorableDate: 'some date',
        memorableEvent: 'some event',
        memorableLocation: 'some location'
      }
    }
  },
  ruralPaymentsBusiness: {
    getOrganisationCustomersByOrganisationId() {
      return organisationPeopleByOrgId(orgId)._data
    }
  },
  permissions: new Permissions()
}

describe('Customer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Customer.info', async () => {
    const response = await Customer.info(
      { crn: personFixture.customerReferenceNumber },
      undefined,
      { dataSources }
    )

    expect(response).toEqual({
      name: {
        title: 'Mrs.',
        otherTitle: 'I',
        first: 'Lauren',
        middle: 'Daryl',
        last: 'Sanford'
      },
      dateOfBirth: '1973-06-14T10:26:18.380Z',
      phone: { landline: '055 4582 4488', mobile: '056 8967 5108' },
      email: { address: 'lauren.sanford@immaculate-shark.info', validated: false },
      doNotContact: false,
      address: {
        line1: '65',
        line2: '1 McCullough Path',
        line3: 'Newton Ratkedon',
        line4: 'MS9 8BJ',
        line5: 'North Macedonia',
        pafOrganisationName: null,
        flatName: null,
        buildingNumberRange: null,
        buildingName: null,
        street: null,
        city: 'Newton Bruen',
        county: null,
        postalCode: 'TC2 8KP',
        country: 'Wales',
        uprn: '790214962932',
        dependentLocality: null,
        doubleDependentLocality: null,
        typeId: null
      },
      status: { locked: false, confirmed: false, deactivated: false },
      personalIdentifiers: ['8568845789', '370030956', '7899566034']
    })
  })

  test('Customer.business - returns null if no business', async () => {
    const response = await Customer.business(
      { crn: personFixture.customerReferenceNumber },
      { sbi: 107183280 },
      { dataSources }
    )
    expect(response).toEqual(null)
  })

  test('Customer.business - returns business', async () => {
    const response = await Customer.business(
      { crn: personFixture.customerReferenceNumber },
      { sbi: 107591843 },
      { dataSources }
    )
    expect(response).toEqual({
      crn: 'crn-11111111',
      organisationId: '5625145',
      personId: 11111111,
      name: 'Cliff Spence T/As Abbey Farm',
      sbi: 107591843
    })
  })

  test('Customer.businesses', async () => {
    const response = await Customer.businesses({ personId: '5007136' }, undefined, { dataSources })
    expect(response).toEqual([
      {
        name: 'Cliff Spence T/As Abbey Farm',
        sbi: 107591843,
        organisationId: '5625145',
        personId: 11111111,
        crn: undefined
      }
    ])
  })

  test('Customer.authenticationQuestions', async () => {
    const response = await Customer.authenticationQuestions({ crn: 'mockCustomerCRN' }, undefined, {
      dataSources
    })
    expect(response).toEqual({
      isFound: true,
      memorableDate: 'some date',
      memorableEvent: 'some event',
      memorableLocation: 'some location',
      updatedAt: undefined
    })
  })

  test('Customer.authenticationQuestions - error', async () => {
    expect(
      Customer.authenticationQuestions({ id: 'mockCustomerId' }, { dataSources })
    ).rejects.toThrow(Error)
  })
})

describe('CustomerBusiness', () => {
  test('CustomerBusiness.role', async () => {
    const response = await CustomerBusiness.role(
      { organisationId: '4309257', crn: '1638563942' },
      undefined,
      { dataSources }
    )
    expect(response).toEqual('Business Partner')
  })

  test('CustomerBusiness.permissionGroups', async () => {
    const response = await CustomerBusiness.permissionGroups(
      { organisationId: '5625145', crn: '1638563942' },
      undefined,
      {
        dataSources
      }
    )

    const permissions = buildPermissionsFromIdsAndLevels([
      [
        { id: 'BASIC_PAYMENT_SCHEME', level: 'SUBMIT' },
        { id: 'BUSINESS_DETAILS', level: 'FULL_PERMISSION' },
        { id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS', level: 'NO_ACCESS' },
        { id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS', level: 'NO_ACCESS' },
        { id: 'ENTITLEMENTS', level: 'AMEND' },
        { id: 'ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS', level: 'NO_ACCESS' },
        { id: 'LAND_DETAILS', level: 'AMEND' }
      ]
    ])[0]
    expect(response).toEqual(permissions)
  })

  describe('CustomerBusiness.messages', () => {
    beforeEach(() => {
      jest.clearAllMocks()

      dataSources.ruralPaymentsCustomer.getNotificationsByOrganisationIdAndPersonId.mockImplementation(
        () => [
          {
            id: 'mockId1',
            personId: 'mockPersonId1',
            organisationId: 'mockOrganisationId1',
            messageId: 'mockMessageId1',
            readAt: null,
            archivedAt: new Date(Date.parse('2024-01-01')),
            archive: null,
            createdAt: new Date(Date.parse('2024-01-01')),
            title: 'Mock Title 1',
            body: 'Mock Body 1',
            category: 'Mock Category 1',
            bespokeNotificationId: null
          },
          {
            id: 'mockId2',
            personId: 'mockPersonId2',
            organisationId: 'mockOrganisationId2',
            messageId: 'mockMessageId2',
            readAt: null,
            archivedAt: new Date(Date.parse('2025-01-01')),
            archive: null,
            createdAt: new Date(Date.parse('2025-01-01')),
            title: 'Mock Title 2',
            body: 'Mock Body 2',
            category: 'Mock Category 2',
            bespokeNotificationId: null
          }
        ]
      )
    })

    test('get all messages', async () => {
      const response = await CustomerBusiness.messages(
        { organisationId: 'mockOrganisationId', personId: 'mockPersonId' },
        {},
        { dataSources }
      )

      expect(
        dataSources.ruralPaymentsCustomer.getNotificationsByOrganisationIdAndPersonId
      ).toHaveBeenCalledWith('mockOrganisationId', 'mockPersonId', undefined)

      expect(response).toEqual([
        {
          id: 'mockId1',
          subject: 'Mock Title 1',
          date: '2024-01-01T00:00:00.000Z',
          body: 'Mock Body 1',
          read: false,
          deleted: true
        },
        {
          id: 'mockId2',
          subject: 'Mock Title 2',
          date: '2025-01-01T00:00:00.000Z',
          body: 'Mock Body 2',
          read: false,
          deleted: true
        }
      ])
    })

    test('get messages fromDate', async () => {
      const response = await CustomerBusiness.messages(
        { organisationId: 'mockOrganisationId', personId: 'mockPersonId' },
        { fromDate: '2024-12-31' },
        { dataSources }
      )

      expect(
        dataSources.ruralPaymentsCustomer.getNotificationsByOrganisationIdAndPersonId
      ).toHaveBeenCalledWith(
        'mockOrganisationId',
        'mockPersonId',
        new Date(Date.parse('2024-12-31'))
      )

      expect(response).toEqual([
        {
          id: 'mockId1',
          subject: 'Mock Title 1',
          date: '2024-01-01T00:00:00.000Z',
          body: 'Mock Body 1',
          read: false,
          deleted: true
        },
        {
          id: 'mockId2',
          subject: 'Mock Title 2',
          date: '2025-01-01T00:00:00.000Z',
          body: 'Mock Body 2',
          read: false,
          deleted: true
        }
      ])
    })

    test('get messages fromDate; should fail if date is in the future', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000 * 2).toISOString().slice(0, 10)

      await expect(
        CustomerBusiness.messages(
          { organisationId: 'mockOrganisationId', personId: 'mockPersonId' },
          { fromDate: futureDate },
          { dataSources }
        )
      ).rejects.toThrow(`Invalid date: "${futureDate}" must be in the past.`)
    })
  })
})

describe('CustomerBusinessPermissionGroup', () => {
  test('CustomerBusinessPermissionGroup.level', async () => {
    const response = await CustomerBusiness.permissionGroups(
      {
        organisationId: orgId,
        crn: '1638563942',
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

    const permissions = buildPermissionsFromIdsAndLevels([
      [
        { id: 'BASIC_PAYMENT_SCHEME', level: 'SUBMIT' },
        { id: 'BUSINESS_DETAILS', level: 'FULL_PERMISSION' },
        { id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS', level: 'NO_ACCESS' },
        { id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS', level: 'NO_ACCESS' },
        { id: 'ENTITLEMENTS', level: 'AMEND' },
        { id: 'ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS', level: 'NO_ACCESS' },
        { id: 'LAND_DETAILS', level: 'AMEND' }
      ]
    ])[0]
    expect(response).toEqual(permissions)
  })
})
