import { Permissions } from '../../../../app/data-sources/static/permissions.js'
import {
  transformBusinessCustomerPrivilegesToPermissionGroups,
  transformCountyParishHoldings,
  transformOrganisationCustomers
} from '../../../../app/transformers/rural-payments/business.js'
import { organisationPeopleByOrgId } from '../../../fixtures/organisation.js'
import { buildPermissionsFromIdsAndLevels } from '../../../test-helpers/permissions.js'

describe('Business transformer', () => {
  test('#transformOrganisationCustomers', () => {
    const { _data: customers } = organisationPeopleByOrgId(5565448)

    const transformedCustomers = customers.map((customer) => {
      return {
        personId: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        crn: customer.customerReference,
        role: customer.role,
        privileges: customer.privileges
      }
    })

    expect(transformOrganisationCustomers(customers)).toEqual(transformedCustomers)
  })

  const permissionGroups = new Permissions().getPermissionGroups()
  const expectedPermissions = buildPermissionsFromIdsAndLevels([
    [
      { id: 'BASIC_PAYMENT_SCHEME', level: 'SUBMIT' },
      { id: 'BUSINESS_DETAILS', level: 'FULL_PERMISSION' },
      { id: 'ENTITLEMENTS', level: 'AMEND' },
      { id: 'LAND_DETAILS', level: 'AMEND' }
    ],
    [
      { id: 'BASIC_PAYMENT_SCHEME', level: 'SUBMIT' },
      { id: 'BUSINESS_DETAILS', level: 'FULL_PERMISSION' },
      { id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS', level: 'SUBMIT' },
      { id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS', level: 'SUBMIT' },
      { id: 'ENTITLEMENTS', level: 'AMEND' },
      { id: 'LAND_DETAILS', level: 'AMEND' }
    ],
    [
      { id: 'BASIC_PAYMENT_SCHEME', level: 'AMEND' },
      { id: 'BUSINESS_DETAILS', level: 'FULL_PERMISSION' },
      { id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS', level: 'SUBMIT' },
      { id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS', level: 'SUBMIT' },
      { id: 'ENTITLEMENTS', level: 'AMEND' },
      { id: 'LAND_DETAILS', level: 'AMEND' }
    ],
    [
      { id: 'BASIC_PAYMENT_SCHEME', level: 'SUBMIT' },
      { id: 'BUSINESS_DETAILS', level: 'FULL_PERMISSION' },
      { id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS', level: 'SUBMIT' },
      { id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS', level: 'SUBMIT' },
      { id: 'ENTITLEMENTS', level: 'AMEND' },
      { id: 'ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS', level: 'SUBMIT' },
      { id: 'LAND_DETAILS', level: 'AMEND' }
    ],
    [
      { id: 'BASIC_PAYMENT_SCHEME', level: 'SUBMIT' },
      { id: 'BUSINESS_DETAILS', level: 'FULL_PERMISSION' },
      { id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS', level: 'SUBMIT' },
      { id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS', level: 'SUBMIT' },
      { id: 'ENTITLEMENTS', level: 'AMEND' },
      { id: 'ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS', level: 'NO_ACCESS' },
      { id: 'LAND_DETAILS', level: 'AMEND' }
    ]
  ])

  test('#transformBusinessCustomerPrivilegesToPermissionGroups', () => {
    const { _data: customers } = organisationPeopleByOrgId(5565448)

    const transformedPermissionGroups = customers.map((customer) => {
      return transformBusinessCustomerPrivilegesToPermissionGroups(
        customer.privileges,
        permissionGroups
      )
    })

    expect(transformedPermissionGroups).toEqual(expectedPermissions)
  })

  test('#transformCountyParishHoldings', () => {
    const mockData = [
      {
        sbi: 'mockSbi',
        dt_insert: 'mockDtInsert4',
        dt_delete: 'mockDtDelete4',
        cph_number: 'mockCph2',
        parish: 'mockParish',
        species: 'mockSpecies4',
        start_date: '2021-04-15T00:00:00:000+0100',
        end_date: '2022-04-15T00:00:00:000+0100',
        address: 'mockAddress',
        x: 789012,
        y: 210987
      },
      {
        sbi: 'mockSbi',
        dt_insert: 'mockDtInsert1',
        dt_delete: 'mockDtDelete1',
        cph_number: 'mockCph1',
        parish: 'mockParish',
        species: 'mockSpecies',
        start_date: '2020-03-20T00:00:00:000+0100',
        end_date: '2021-03-20T00:00:00:000+0100',
        address: 'mockAddress',
        x: 123456,
        y: 654321
      },
      {
        sbi: 'mockSbi',
        dt_insert: 'mockDtInsert3',
        dt_delete: 'mockDtDelete3',
        cph_number: 'mockCph2',
        parish: 'mockParish',
        species: 'mockSpecies',
        start_date: '2019-04-15T00:00:00:000+0100',
        end_date: '2020-04-15T00:00:00:000+0100',
        address: 'mockAddress',
        x: 789012,
        y: 210987
      },
      {
        sbi: 'mockSbi',
        dt_insert: 'mockDtInsert2',
        dt_delete: 'mockDtDelete2',
        cph_number: 'mockCph1',
        parish: 'mockParish',
        species: 'mockSpecies',
        start_date: '2018-03-20T00:00:00:000+0100',
        end_date: '2019-03-20T00:00:00:000+0100',
        address: 'mockAddress',
        x: 123456,
        y: 654321
      }
    ]

    expect(transformCountyParishHoldings(mockData)).toEqual([
      {
        cphNumber: 'mockCph1',
        endDate: '2021-03-20',
        parish: 'mockParish',
        species: 'mockSpecies',
        startDate: '2020-03-20',
        xCoordinate: 123456,
        yCoordinate: 654321
      },
      {
        cphNumber: 'mockCph1',
        endDate: '2019-03-20',
        parish: 'mockParish',
        species: 'mockSpecies',
        startDate: '2018-03-20',
        xCoordinate: 123456,
        yCoordinate: 654321
      },
      {
        cphNumber: 'mockCph2',
        endDate: '2022-04-15',
        parish: 'mockParish',
        species: 'mockSpecies4',
        startDate: '2021-04-15',
        xCoordinate: 789012,
        yCoordinate: 210987
      },
      {
        cphNumber: 'mockCph2',
        endDate: '2020-04-15',
        parish: 'mockParish',
        species: 'mockSpecies',
        startDate: '2019-04-15',
        xCoordinate: 789012,
        yCoordinate: 210987
      }
    ])
  })
})
