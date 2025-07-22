import { Permissions } from '../../../../app/data-sources/static/permissions.js'
import {
  transformAgreements,
  transformBusinessCustomerPrivilegesToPermissionGroups,
  transformBusinessDetailsToOrgDetailsUpdate,
  transformCountyParishHoldings,
  transformOrganisationCustomers
} from '../../../../app/transformers/rural-payments/business.js'
import { organisationPeopleByOrgId } from '../../../fixtures/organisation.js'
import { buildPermissionsFromIdsAndLevels } from '../../../test-helpers/permissions.js'

const baseInput = {
  name: 'HADLEY FARMS LTD 2',
  address: {
    pafOrganisationName: 'pafOrganisationName',
    line1: 'line1',
    line2: 'line2',
    line3: 'line3',
    line4: 'line4',
    line5: 'line5',
    buildingNumberRange: 'buildingNumberRange',
    buildingName: 'COLSHAW HALL',
    flatName: null,
    street: 'street',
    city: 'BRAINTREE',
    county: null,
    postalCode: '12312312',
    country: 'United Kingdom',
    uprn: '123123123',
    dependentLocality: 'HIGH HAWSKER',
    doubleDependentLocality: null
  },
  correspondenceAddress: {
    pafOrganisationName: 'c pafOrganisationName',
    line1: 'c line1',
    line2: 'c line2',
    line3: 'c line3',
    line4: 'c line4',
    line5: 'c line5',
    buildingNumberRange: 'buildingNumberRange',
    buildingName: 'buildingName',
    flatName: 'flatName',
    street: 'street',
    city: 'city',
    county: 'county',
    postalCode: '1231231',
    country: 'USA',
    uprn: '10008042952',
    dependentLocality: 'HIGH HAWSKER',
    doubleDependentLocality: 'doubleDependentLocality'
  },
  phone: {
    mobile: '01234042273',
    landline: '01234613020'
  },
  email: {
    address: 'hadleyfarmsltdp@defra.com.test'
  },
  correspondenceEmail: {
    address: 'hadleyfarmsltdp@defra.com.123'
  },
  correspondencePhone: {
    mobile: '07111222333',
    landline: '01225111222'
  },
  isCorrespondenceAsBusinessAddress: false
}

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

  test('#transformCountyParishHoldings returns `null` if not array', () => {
    expect(transformCountyParishHoldings('')).toEqual(null)
    expect(transformCountyParishHoldings()).toEqual(null)
    expect(transformCountyParishHoldings({})).toEqual(null)
    expect(transformCountyParishHoldings(1)).toEqual(null)
    expect(transformCountyParishHoldings(null)).toEqual(null)
    expect(transformCountyParishHoldings(undefined)).toEqual(null)
  })

  test('#transformCountyParishHoldings returns empty array', () => {
    expect(transformCountyParishHoldings([])).toEqual([])
  })

  test('#transformCountyParishHoldings handles null values', () => {
    expect(
      transformCountyParishHoldings([
        {
          cph_number: null,
          parish: null,
          species: null,
          start_date: null,
          end_date: null,
          x: null,
          y: null,
          address: null
        }
      ])
    ).toEqual([
      {
        address: null,
        cphNumber: null,
        endDate: null,
        parish: null,
        species: null,
        startDate: null,
        xCoordinate: null,
        yCoordinate: null
      }
    ])
  })

  test('#transformAgreements', () => {
    const mockData = [
      {
        contract_id: '123',
        agreement_name: 'mockAgreement',
        status: 'mockStatus',
        contract_type: 'mockContractType',
        scheme_year: 'mockSchemeYear',
        start_date: '2020-01-01T00:00:00:000+0100',
        end_date: '2020-12-31T00:00:00:000+0100',
        payment_schedules: [
          {
            option_code: 'mockOptionCode',
            option_description: 'mockOptionDescription',
            commitment_group_start_date: '2020-01-01T00:00:00:000+0100',
            commitment_group_end_date: '2020-12-31T00:00:00:000+0100',
            year: '2020',
            sheet_name: 'mockSheetName',
            parcel_name: 'mockParcelName',
            action_area: 100000,
            action_mtl: 'mockActionMTL',
            action_units: 'mockActionUnits',
            parcel_total_area: 100000,
            payment_schedule_start_date: '2020-01-01T00:00:00:000+0100',
            payment_schedule_end_date: '2020-12-31T00:00:00:000+0100'
          }
        ]
      }
    ]

    expect(transformAgreements(mockData)).toEqual([
      {
        contractId: '123',
        name: 'mockAgreement',
        status: 'mockStatus',
        contractType: 'mockContractType',
        schemeYear: 'mockSchemeYear',
        startDate: '2020-01-01T00:00:00.000Z',
        endDate: '2020-12-31T00:00:00.000Z',
        paymentSchedules: [
          {
            optionCode: 'mockOptionCode',
            optionDescription: 'mockOptionDescription',
            commitmentGroupStartDate: '2020-01-01T00:00:00.000Z',
            commitmentGroupEndDate: '2020-12-31T00:00:00.000Z',
            year: '2020',
            sheetName: 'mockSheetName',
            parcelName: 'mockParcelName',
            actionArea: 10,
            actionMTL: 'mockActionMTL',
            actionUnits: 'mockActionUnits',
            parcelTotalArea: 10,
            startDate: '2020-01-01T00:00:00.000Z',
            endDate: '2020-12-31T00:00:00.000Z'
          }
        ]
      }
    ])
  })
})

describe('#transformBusinessDetailsToOrgDetailsUpdate', () => {
  it('transforms base input correctly', () => {
    const result = transformBusinessDetailsToOrgDetailsUpdate(baseInput)
    expect(result).toEqual({
      name: 'HADLEY FARMS LTD 2',
      address: {
        address1: 'line1',
        address2: 'line2',
        address3: 'line3',
        address4: 'line4',
        address5: 'line5',
        pafOrganisationName: 'pafOrganisationName',
        flatName: null,
        buildingNumberRange: 'buildingNumberRange',
        buildingName: 'COLSHAW HALL',
        street: 'street',
        city: 'BRAINTREE',
        county: null,
        postalCode: '12312312',
        country: 'United Kingdom',
        uprn: '123123123',
        dependentLocality: 'HIGH HAWSKER',
        doubleDependentLocality: null,
        addressTypeId: undefined
      },
      correspondenceAddress: {
        address1: 'c line1',
        address2: 'c line2',
        address3: 'c line3',
        address4: 'c line4',
        address5: 'c line5',
        dependentLocality: 'HIGH HAWSKER',
        pafOrganisationName: 'c pafOrganisationName',
        doubleDependentLocality: 'doubleDependentLocality',
        buildingName: 'buildingName',
        buildingNumberRange: 'buildingNumberRange',
        city: 'city',
        country: 'USA',
        county: 'county',
        flatName: 'flatName',
        postalCode: '1231231',
        street: 'street',
        uprn: '10008042952',
        addressTypeId: undefined
      },
      isCorrespondenceAsBusinessAddr: false,
      email: 'hadleyfarmsltdp@defra.com.test',
      landline: '01234613020',
      mobile: '01234042273',
      correspondenceEmail: 'hadleyfarmsltdp@defra.com.123',
      correspondenceLandline: '01225111222',
      correspondenceMobile: '07111222333'
    })
  })

  it('handles undefined and null in nested correspondence fields', () => {
    const input = {
      ...baseInput,
      correspondenceAddress: null,
      isCorrespondenceAsBusinessAddr: false,
      correspondenceEmail: { address: null },
      correspondencePhone: { mobile: null, landline: undefined }
    }
    const result = transformBusinessDetailsToOrgDetailsUpdate(input)
    expect(result.correspondenceAddress).toBeUndefined()
    expect(result.isCorrespondenceAsBusinessAddr).toBe(false)
    expect(result.correspondenceEmail).toBeNull()
    expect(result.correspondenceLandline).toBeUndefined()
    expect(result.correspondenceMobile).toBeNull()
  })

  it('handles missing address nested fields', () => {
    const input = {
      ...baseInput,
      address: {
        ...baseInput.address,
        line3: undefined,
        line4: undefined,
        pafOrganisationName: undefined,
        typeId: undefined
      }
    }
    const result = transformBusinessDetailsToOrgDetailsUpdate(input)
    expect(result.address.address3).toBeUndefined()
    expect(result.address.address4).toBeUndefined()
    expect(result.address.pafOrganisationName).toBeUndefined()
    expect(result.address.addressTypeId).toBeUndefined()
  })

  it('handles missing phone nested fields', () => {
    const input = {
      ...baseInput,
      phone: {
        mobile: undefined,
        landline: undefined
      }
    }
    const result = transformBusinessDetailsToOrgDetailsUpdate(input)
    expect(result.mobile).toBeUndefined()
    expect(result.landline).toBeUndefined()
  })
})
