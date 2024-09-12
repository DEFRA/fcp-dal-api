import { Permissions } from '../../../app/data-sources/static/permissions.js'
import {
  transformBusinessCustomerToCustomerPermissionGroups,
  transformBusinessCustomerToCustomerRole,
  transformPersonSummaryToCustomerAuthorisedBusinesses
} from '../../../app/transformers/rural-payments/customer.js'
import {
  organisationPeopleByOrgId,
  organisationPersonSummary
} from '../../../mocks/fixtures/organisation.js'

describe('Customer transformer', () => {
  test('#transformBusinessCustomerToCustomerRole', () => {
    const { _data: customers } = organisationPeopleByOrgId(5565448)

    const customer = customers[0]

    const transformedRole = transformBusinessCustomerToCustomerRole(
      customer.customerReference,
      customers
    )

    expect(transformedRole).toEqual('Business Partner')
  })

  test('#transformPersonSummaryToCustomerAuthorisedBusinesses', () => {
    const data = organisationPersonSummary({ id: 5302028 })._data

    const personId = '5302028'
    const crn = '0866159801'

    const transformed = transformPersonSummaryToCustomerAuthorisedBusinesses(
      { personId, crn },
      data
    )

    expect(transformed).toEqual([
      {
        name: data[0].name,
        sbi: data[0].sbi,
        organisationId: data[0].id,
        personId,
        crn
      }
    ])
  })

  describe('#transformBusinessCustomerToCustomerPermissionGroups', () => {
    const permissionGroups = new Permissions().getPermissionGroups()

    test('should fail with NO_ACCESS if no customers', () => {
      const transformedPermissionGroups =
        transformBusinessCustomerToCustomerPermissionGroups(
          'crn',
          [],
          permissionGroups
        )

      expect(transformedPermissionGroups).toEqual([
        { id: 'BASIC_PAYMENT_SCHEME', level: 'NO_ACCESS' },
        { id: 'BUSINESS_DETAILS', level: 'NO_ACCESS' },
        { id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS', level: 'NO_ACCESS' },
        { id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS', level: 'NO_ACCESS' },
        { id: 'ENTITLEMENTS', level: 'NO_ACCESS' },
        { id: 'ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS', level: 'NO_ACCESS' },
        { id: 'LAND_DETAILS', level: 'NO_ACCESS' }
      ])
    })

    test('should fail with NO_ACCESS if customers with no privileges', () => {
      const transformedPermissionGroups =
        transformBusinessCustomerToCustomerPermissionGroups(
          'crn',
          [{ customerReference: 'crn' }],
          permissionGroups
        )

      expect(transformedPermissionGroups).toEqual([
        { id: 'BASIC_PAYMENT_SCHEME', level: 'NO_ACCESS' },
        { id: 'BUSINESS_DETAILS', level: 'NO_ACCESS' },
        { id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS', level: 'NO_ACCESS' },
        { id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS', level: 'NO_ACCESS' },
        { id: 'ENTITLEMENTS', level: 'NO_ACCESS' },
        { id: 'ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS', level: 'NO_ACCESS' },
        { id: 'LAND_DETAILS', level: 'NO_ACCESS' }
      ])
    })

    test('should return correct privilege', () => {
      const transformedPermissionGroups =
        transformBusinessCustomerToCustomerPermissionGroups(
          'crn',
          [{ customerReference: 'crn', privileges: ['VIEW - BPS - SA'] }],
          permissionGroups
        )

      expect(transformedPermissionGroups).toEqual([
        { id: 'BASIC_PAYMENT_SCHEME', level: 'VIEW' },
        { id: 'BUSINESS_DETAILS', level: 'NO_ACCESS' },
        { id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS', level: 'NO_ACCESS' },
        { id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS', level: 'NO_ACCESS' },
        { id: 'ENTITLEMENTS', level: 'NO_ACCESS' },
        { id: 'ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS', level: 'NO_ACCESS' },
        { id: 'LAND_DETAILS', level: 'NO_ACCESS' }
      ])
    })

    test('should return highest privilege when two in same group', () => {
      const permissionGroups = new Permissions().getPermissionGroups()

      const transformedPermissionGroups =
        transformBusinessCustomerToCustomerPermissionGroups(
          'crn',
          [
            {
              customerReference: 'crn',
              privileges: ['AMEND - BPS - SA', 'VIEW - BPS - SA']
            }
          ],
          permissionGroups
        )

      expect(transformedPermissionGroups).toEqual([
        { id: 'BASIC_PAYMENT_SCHEME', level: 'AMEND' },
        { id: 'BUSINESS_DETAILS', level: 'NO_ACCESS' },
        { id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS', level: 'NO_ACCESS' },
        { id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS', level: 'NO_ACCESS' },
        { id: 'ENTITLEMENTS', level: 'NO_ACCESS' },
        { id: 'ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS', level: 'NO_ACCESS' },
        { id: 'LAND_DETAILS', level: 'NO_ACCESS' }
      ])
    })

    test('should be case insensitive', () => {
      const permissionGroups = new Permissions().getPermissionGroups()

      const transformedPermissionGroups =
        transformBusinessCustomerToCustomerPermissionGroups(
          'crn',
          [{ customerReference: 'crn', privileges: ['aMenD - bPS - sA'] }],
          permissionGroups
        )

      expect(transformedPermissionGroups).toEqual([
        { id: 'BASIC_PAYMENT_SCHEME', level: 'AMEND' },
        { id: 'BUSINESS_DETAILS', level: 'NO_ACCESS' },
        { id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS', level: 'NO_ACCESS' },
        { id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS', level: 'NO_ACCESS' },
        { id: 'ENTITLEMENTS', level: 'NO_ACCESS' },
        { id: 'ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS', level: 'NO_ACCESS' },
        { id: 'LAND_DETAILS', level: 'NO_ACCESS' }
      ])
    })

    const cases = [
      ['NO ACCESS - BPS - SA', { id: 'BASIC_PAYMENT_SCHEME', level: 'NO_ACCESS' }],
      ['NO ACCESS - BPS', { id: 'BASIC_PAYMENT_SCHEME', level: 'NO_ACCESS' }],
      ['VIEW - BPS - SA', { id: 'BASIC_PAYMENT_SCHEME', level: 'VIEW' }],
      ['View - bps', { id: 'BASIC_PAYMENT_SCHEME', level: 'VIEW' }],
      ['AMEND - BPS - SA', { id: 'BASIC_PAYMENT_SCHEME', level: 'AMEND' }],
      ['Amend - bps', { id: 'BASIC_PAYMENT_SCHEME', level: 'AMEND' }],
      ['SUBMIT - BPS - SA', { id: 'BASIC_PAYMENT_SCHEME', level: 'SUBMIT' }],
      ['Submit - bps', { id: 'BASIC_PAYMENT_SCHEME', level: 'SUBMIT' }],
      ['View - business', { id: 'BUSINESS_DETAILS', level: 'VIEW' }],
      ['Amend - business', { id: 'BUSINESS_DETAILS', level: 'AMEND' }],
      ['Make legal changes - business', { id: 'BUSINESS_DETAILS', level: 'MAKE_LEGAL_CHANGES' }],
      ['Full permission - business', { id: 'BUSINESS_DETAILS', level: 'FULL_PERMISSION' }],
      ['NO ACCESS - CS AGREE - SA', { id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS', level: 'NO_ACCESS' }],
      ['NO ACCESS - CS AGREE', { id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS', level: 'NO_ACCESS' }],
      ['VIEW - CS AGREE - SA', { id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS', level: 'VIEW' }],
      ['View - cs agree', { id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS', level: 'VIEW' }],
      ['AMEND - CS AGREE - SA', { id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS', level: 'AMEND' }],
      ['Amend - cs agree', { id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS', level: 'AMEND' }],
      ['SUBMIT - CS AGREE - SA', { id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS', level: 'SUBMIT' }],
      ['Submit - cs agree', { id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS', level: 'SUBMIT' }],
      ['NO ACCESS - CS APP - SA', { id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS', level: 'NO_ACCESS' }],
      ['NO ACCESS - CS APP', { id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS', level: 'NO_ACCESS' }],
      ['VIEW - CS APP - SA', { id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS', level: 'VIEW' }],
      ['VIEW - CS APP', { id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS', level: 'VIEW' }],
      ['AMEND - CS APP - SA', { id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS', level: 'AMEND' }],
      ['Amend - cs app', { id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS', level: 'AMEND' }],
      ['SUBMIT - CS APP - SA', { id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS', level: 'SUBMIT' }],
      ['Submit - cs app', { id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS', level: 'SUBMIT' }],
      ['NO ACCESS - ENTITLEMENT - SA', { id: 'ENTITLEMENTS', level: 'NO_ACCESS' }],
      ['NO ACCESS - ENTITLEMENT', { id: 'ENTITLEMENTS', level: 'NO_ACCESS' }],
      ['VIEW - ENTITLEMENT - SA', { id: 'ENTITLEMENTS', level: 'VIEW' }],
      ['View - entitlement', { id: 'ENTITLEMENTS', level: 'VIEW' }],
      ['AMEND - ENTITLEMENT - SA', { id: 'ENTITLEMENTS', level: 'AMEND' }],
      ['Amend - entitlement', { id: 'ENTITLEMENTS', level: 'AMEND' }],
      ['ELM_APPLICATION_NO_ACCESS', { id: 'ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS', level: 'NO_ACCESS' }],
      ['ELM_APPLICATION_VIEW', { id: 'ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS', level: 'VIEW' }],
      ['ELM_APPLICATION_AMEND', { id: 'ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS', level: 'AMEND' }],
      ['ELM_APPLICATION_SUBMIT', { id: 'ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS', level: 'SUBMIT' }],
      ['NO ACCESS - LAND - SA', { id: 'LAND_DETAILS', level: 'NO_ACCESS' }],
      ['NO ACCESS - LAND', { id: 'LAND_DETAILS', level: 'NO_ACCESS' }],
      ['VIEW - LAND - SA', { id: 'LAND_DETAILS', level: 'VIEW' }],
      ['View - land', { id: 'LAND_DETAILS', level: 'VIEW' }],
      ['AMEND - LAND - SA', { id: 'LAND_DETAILS', level: 'AMEND' }],
      ['Amend - land', { id: 'LAND_DETAILS', level: 'AMEND' }]
    ]

    test.each(cases)(
      'given %p in customer.privileges, should return %p',
      (privilegeName, expectedResult) => {
        expect(transformBusinessCustomerToCustomerPermissionGroups(
          'crn',
          [{ customerReference: 'crn', privileges: [privilegeName] }],
          permissionGroups
        )).toContainEqual(expectedResult)
      }
    )

    test('should cover all privilege names', () => {
      const privilegeNames = permissionGroups.flatMap(({ permissions }) => permissions).flatMap(({ privilegeNames }) => privilegeNames)
      const privilegeNameCases = cases.map(([privilegeName]) => privilegeName)
      expect(privilegeNames).toEqual(privilegeNameCases)
    })
  })
})
