import { jest } from '@jest/globals'

import { Permissions } from '../../../app/data-sources/static/permissions.js'
import { Customer, CustomerBusiness } from '../../../app/graphql/resolvers/customer/customer.js'
import {
  organisationPeopleByOrgId,
  organisationPersonSummary
} from '../../fixtures/organisation.js'
import { personById } from '../../fixtures/person.js'
import { buildPermissionsFromIdsAndLevels } from '../../test-helpers/permissions.js'

const orgId = '5565448'
const personId = '5007136'
const personFixture = personById({ id: personId })

const dataSources = {
  ruralPaymentsCustomer: {
    getCustomerByCRN() {
      return personById({ id: personId })._data
    },
    getPersonBusinessesByPersonId() {
      return organisationPersonSummary({ id: personId })._data
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
      { crn: personFixture._data.customerReferenceNumber },
      undefined,
      { dataSources }
    )

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
    const response = await Customer.business(
      { crn: personFixture._data.customerReferenceNumber },
      { sbi: 107183280 },
      { dataSources }
    )
    expect(response).toEqual(null)
  })

  test('Customer.business - returns business', async () => {
    const response = await Customer.business(
      { crn: personFixture._data.customerReferenceNumber },
      { sbi: 107591843 },
      { dataSources }
    )
    expect(response).toEqual({
      crn: '0866159801',
      organisationId: '5625145',
      personId: 5007136,
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
        personId: 5007136,
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
