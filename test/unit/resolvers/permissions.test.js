import { describe, expect, it, test, vi } from 'vitest'
import {
  InternalUser,
  Permission,
  Query
} from '../../../app/graphql/resolvers/permissions/query.js'

const organisationPeopleData = {
  _data: [
    {
      id: 5263421,
      firstName: 'Nicholas',
      lastName: 'SANGSTER',
      customerReference: '9638563942',
      confirmed: false,
      lastUpdatedOn: 1614108764000,
      role: 'Business Partner',
      privileges: [
        'Full permission - business',
        'Amend - land',
        'Amend - entitlement',
        'Submit - bps',
        'SUBMIT - BPS - SA',
        'AMEND - ENTITLEMENT - SA',
        'AMEND - LAND - SA'
      ]
    },
    {
      id: 5302028,
      firstName:
        'Ingrid Jerimire Klaufichus Limouhetta Mortimious Neuekind Orpheus Perimillian Quixillotrio Reviticlese',
      lastName: 'Cook',
      customerReference: '9477368292',
      confirmed: true,
      lastUpdatedOn: 1688626184383,
      role: 'Agent',
      privileges: [
        'Full permission - business',
        'SUBMIT - CS APP - SA',
        'SUBMIT - CS AGREE - SA',
        'Amend - land',
        'Amend - entitlement',
        'Submit - bps',
        'SUBMIT - BPS - SA',
        'AMEND - ENTITLEMENT - SA',
        'AMEND - LAND - SA',
        'Submit - cs app',
        'Submit - cs agree'
      ]
    },
    {
      id: 5311964,
      firstName: 'Trevor',
      lastName: 'Graham',
      customerReference: '9477368293',
      confirmed: true,
      lastUpdatedOn: 1689606545687,
      role: 'Agent',
      privileges: [
        'Full permission - business',
        'SUBMIT - CS APP - SA',
        'SUBMIT - CS AGREE - SA',
        'Amend - land',
        'Amend - entitlement',
        'Amend - bps',
        'AMEND - BPS - SA',
        'AMEND - ENTITLEMENT - SA',
        'AMEND - LAND - SA',
        'Submit - cs app',
        'Submit - cs agree'
      ]
    },
    {
      id: 5331098,
      firstName: 'Marcus',
      lastName: 'Twigden',
      customerReference: '9804081228',
      confirmed: true,
      lastUpdatedOn: 1699870896103,
      role: 'Agent',
      privileges: [
        'Full permission - business',
        'SUBMIT - CS APP - SA',
        'SUBMIT - CS AGREE - SA',
        'Amend - land',
        'Amend - entitlement',
        'Submit - bps',
        'SUBMIT - BPS - SA',
        'AMEND - ENTITLEMENT - SA',
        'AMEND - LAND - SA',
        'Submit - cs app',
        'Submit - cs agree',
        'ELM_APPLICATION_SUBMIT'
      ]
    },
    {
      id: 5778203,
      firstName: 'Oliver',
      lastName: 'Colwill',
      customerReference: '9148241575',
      confirmed: true,
      lastUpdatedOn: 1707841972541,
      role: 'Agent',
      privileges: [
        'Full permission - business',
        'SUBMIT - CS APP - SA',
        'SUBMIT - CS AGREE - SA',
        'Amend - land',
        'Amend - entitlement',
        'Submit - bps',
        'SUBMIT - BPS - SA',
        'AMEND - ENTITLEMENT - SA',
        'AMEND - LAND - SA',
        'Submit - cs app',
        'Submit - cs agree',
        'ELM_APPLICATION_NO_ACCESS'
      ]
    }
  ]
}

const organisationBySbiData = {
  _data: [
    {
      id: 5565448,
      name: 'EXAMPLE, AN',
      sbi: 890000001,
      additionalSbiIds: [805179439],
      confirmed: true,
      lastUpdatedOn: 1689694700448,
      landConfirmed: true,
      deactivated: false,
      locked: false,
      address: {
        address1: '1 Example Road',
        address2: 'EXAMPLE VILLAGE',
        address3: 'Example Parish',
        address4: null,
        address5: null,
        pafOrganisationName: 'EXAMPLE ESTATES',
        flatName: 'EXAMPLE FLAT',
        buildingNumberRange: '7',
        buildingName: 'EXAMPLE HALL',
        street: 'EXAMPLE AVENUE',
        city: 'EXAMPLETOWN',
        county: 'Exampleshire',
        postalCode: 'ZZ99 9ZZ',
        country: 'United Kingdom',
        uprn: '99999999999',
        dependentLocality: 'EXAMPLE LOCALITY',
        doubleDependentLocality: 'EXAMPLE SUBLOCALITY',
        addressTypeId: null
      },
      correspondenceAddress: null,
      isFinancialToBusinessAddr: null,
      isCorrespondenceAsBusinessAddr: null
    }
  ],
  _page: { number: 0, size: 1, totalPages: 1, numberOfElements: 1, totalElements: 1 }
}

const personByIdData = {
  _data: {
    title: 'Miss',
    otherTitle: null,
    firstName: 'Nicholas',
    middleName: 'SANGSTER',
    lastName: 'SANGSTER',
    dateOfBirth: '1994-05-08T15:04:30.330Z',
    landline: null,
    fax: null,
    mobile: '7235317560', // sfd-id-check: allow
    email: 'Lonnie75@hotmail.com',
    doNotContact: false,
    emailValidated: false,
    address: {
      pafOrganisationName: null,
      flatName: null,
      buildingNumberRange: null,
      buildingName: '68',
      street: 'Leif End',
      city: 'East Wisoky Cross',
      county: 'Somerset',
      postalCode: 'LN22 2II',
      country: 'United Kingdom',
      uprn: null,
      dependentLocality: null,
      doubleDependentLocality: null,
      addressTypeId: null
    },
    locked: false,
    id: 5263421,
    confirmed: null,
    customerReferenceNumber: '9638563942',
    personalIdentifiers: null,
    deactivated: false
  }
}

const dataSources = {
  ruralPaymentsBusiness: {
    getOrganisationCustomersByOrganisationId(_organisationId) {
      return organisationPeopleData._data
    },
    getOrganisationBySBI(_sbi) {
      return organisationBySbiData._data[0]
    }
  },
  ruralPaymentsCustomer: {
    getCustomerByCRN() {
      return personByIdData._data
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
    { crn: '9102634220', sbi: '890000001' },
    {
      dataSources
    }
  )
  expect(response).toEqual(true)
})

test('Query.internalUser', () => {
  expect(Query.internalUser()).toEqual({})
})

describe('InternalUser.permittedFunctions', () => {
  const getInternalUserAuthorisedFunctions = vi.fn()
  const internalUserDataSources = {
    ruralPaymentsCustomer: { getInternalUserAuthorisedFunctions }
  }

  it('maps each requested function to its upstream authorisation flag, in order', async () => {
    getInternalUserAuthorisedFunctions.mockResolvedValueOnce({
      viewLand: true,
      amendBusinessDetails: false
    })

    const result = await InternalUser.permittedFunctions(
      {},
      { functions: ['viewLand', 'amendBusinessDetails'] },
      { dataSources: internalUserDataSources }
    )

    expect(getInternalUserAuthorisedFunctions).toHaveBeenCalledWith([
      'viewLand',
      'amendBusinessDetails'
    ])
    expect(result).toEqual([
      { name: 'viewLand', permitted: true },
      { name: 'amendBusinessDetails', permitted: false }
    ])
  })

  it('defaults to not permitted when the upstream omits a requested function', async () => {
    getInternalUserAuthorisedFunctions.mockResolvedValueOnce({
      viewLand: true
    })

    const result = await InternalUser.permittedFunctions(
      {},
      { functions: ['viewLand', 'someUnknownFunction'] },
      { dataSources: internalUserDataSources }
    )

    expect(result).toEqual([
      { name: 'viewLand', permitted: true },
      { name: 'someUnknownFunction', permitted: false }
    ])
  })

  describe('audit trail', () => {
    const info = { path: { key: 'internalUser', typename: 'Query', prev: undefined } }

    it('records a permitted-function-list entity', async () => {
      const auditTrail = { recordEntity: vi.fn() }
      getInternalUserAuthorisedFunctions.mockResolvedValueOnce({ viewLand: true })

      await InternalUser.permittedFunctions(
        {},
        { functions: ['viewLand'] },
        { dataSources: internalUserDataSources, auditTrail },
        info
      )

      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
        entity: 'permitted-function-list',
        action: 'read'
      })
    })

    it('does not throw when no audit trail is supplied', async () => {
      getInternalUserAuthorisedFunctions.mockResolvedValueOnce({ viewLand: true })

      await InternalUser.permittedFunctions(
        {},
        { functions: ['viewLand'] },
        { dataSources: internalUserDataSources },
        info
      )
    })
  })
})
