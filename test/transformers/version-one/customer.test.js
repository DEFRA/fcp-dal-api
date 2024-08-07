import { Permissions } from '../../../app/data-sources/static/permissions.js'
import { transformBusinessCustomerToCustomerPermissionGroups, transformBusinessCustomerToCustomerRole, transformPersonSummaryToCustomerAuthorisedBusinesses } from '../../../app/transformers/version-one/customer.js'
import { organisationPeopleByOrgId, organisationPersonSummary } from '../../../mocks/fixtures/organisation.js'

describe('Customer transformer', () => {
  test('#transformBusinessCustomerToCustomerRole', () => {
    const { _data: customers } = organisationPeopleByOrgId(5565448)

    const customer = customers[0]

    const transformedRole = transformBusinessCustomerToCustomerRole(customer.customerReference, customers)

    expect(transformedRole).toEqual('Business Partner')
  })

  test('#transformBusinessCustomerToCustomerPermissionGroups', () => {
    const permissionGroups = new Permissions().getPermissionGroups()
    const { _data: customers } = organisationPeopleByOrgId(5565448)

    const customer = customers[0]

    const transformedPermissionGroups = transformBusinessCustomerToCustomerPermissionGroups(customer.customerReference, customers, permissionGroups)

    expect(transformedPermissionGroups).toEqual([
      { id: 'BASIC_PAYMENT_SCHEME', level: 'SUBMIT' },
      { id: 'BUSINESS_DETAILS', level: 'FULL_PERMISSION' },
      { id: 'ENTITLEMENTS', level: 'AMEND' },
      { id: 'LAND_DETAILS', level: 'AMEND' }
    ])
  })

  test('#transformPersonSummaryToCustomerAuthorisedBusinesses', () => {
    const data = organisationPersonSummary({ id: 5302028 })._data

    const customerId = '5302028'
    const crn = '0866159801'

    const transformed = transformPersonSummaryToCustomerAuthorisedBusinesses({ customerId, crn }, data)

    expect(transformed).toEqual([
      {
        name: data[0].name,
        sbi: data[0].sbi,
        businessId: data[0].id,
        customerId,
        crn
      }
    ])
  })
})
