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

  test('#transformCountyParishHoldings sorts CPH numbers numerically by county, parish, and holding', () => {
    const mockData = [
      {
        cph_number: '02/100/00001',
        parish: 'mockParish',
        species: 'mockSpecies',
        start_date: '2020-03-20T00:00:00:000Z',
        end_date: '2021-03-20T00:00:00:000Z',
        x: 'mockX',
        y: 'mockY',
        address: 'mockAddress'
      },
      {
        cph_number: '01/234/56789',
        parish: 'mockParish',
        species: 'mockSpecies',
        start_date: '2018-03-20T00:00:00:000Z',
        end_date: '2019-03-20T00:00:00:000Z',
        x: 'mockX',
        y: 'mockY',
        address: 'mockAddress'
      },
      {
        cph_number: '01/234/12345',
        parish: 'mockParish',
        species: 'mockSpecies',
        start_date: '2019-04-15T00:00:00:000Z',
        end_date: '2020-04-15T00:00:00:000Z',
        x: 'mockX',
        y: 'mockY',
        address: 'mockAddress'
      },
      {
        cph_number: '01/100/99999',
        parish: 'mockParish',
        species: 'mockSpecies',
        start_date: '2021-04-15T00:00:00:000Z',
        end_date: '2022-04-15T00:00:00:000Z',
        x: 'mockX',
        y: 'mockY',
        address: 'mockAddress'
      }
    ]

    expect(transformCountyParishHoldings(mockData)).toEqual([
      {
        cphNumber: '01/100/99999',
        endDate: '2022-04-15',
        parish: 'mockParish',
        species: 'mockSpecies',
        startDate: '2021-04-15',
        xCoordinate: 'mockX',
        yCoordinate: 'mockY',
        address: 'mockAddress'
      },
      {
        cphNumber: '01/234/12345',
        endDate: '2020-04-15',
        parish: 'mockParish',
        species: 'mockSpecies',
        startDate: '2019-04-15',
        xCoordinate: 'mockX',
        yCoordinate: 'mockY',
        address: 'mockAddress'
      },
      {
        cphNumber: '01/234/56789',
        endDate: '2019-03-20',
        parish: 'mockParish',
        species: 'mockSpecies',
        startDate: '2018-03-20',
        xCoordinate: 'mockX',
        yCoordinate: 'mockY',
        address: 'mockAddress'
      },
      {
        cphNumber: '02/100/00001',
        endDate: '2021-03-20',
        parish: 'mockParish',
        species: 'mockSpecies',
        startDate: '2020-03-20',
        xCoordinate: 'mockX',
        yCoordinate: 'mockY',
        address: 'mockAddress'
      }
    ])
  })

  test('#transformCountyParishHoldings sorts by start_date descending', () => {
    const mockData = [
      {
        cph_number: '02/100/00001',
        parish: 'mockParish',
        species: 'mockSpecies',
        start_date: '2020-01-01T00:00:00.000Z',
        end_date: '2020-12-31T00:00:00.000Z',
        x: 'mockX',
        y: 'mockY',
        address: 'mockAddress'
      },
      {
        cph_number: '02/100/00001',
        parish: 'mockParish',
        species: 'mockSpecies',
        start_date: '2021-01-01T00:00:00.000Z',
        end_date: '2021-12-31T00:00:00.000Z',
        x: 'mockX',
        y: 'mockY',
        address: 'mockAddress'
      }
    ]

    expect(transformCountyParishHoldings(mockData)).toEqual([
      {
        cphNumber: '02/100/00001',
        parish: 'mockParish',
        species: 'mockSpecies',
        startDate: '2021-01-01',
        endDate: '2021-12-31',
        xCoordinate: 'mockX',
        yCoordinate: 'mockY',
        address: 'mockAddress'
      },
      {
        cphNumber: '02/100/00001',
        parish: 'mockParish',
        species: 'mockSpecies',
        startDate: '2020-01-01',
        endDate: '2020-12-31',
        xCoordinate: 'mockX',
        yCoordinate: 'mockY',
        address: 'mockAddress'
      }
    ])
  })
})
