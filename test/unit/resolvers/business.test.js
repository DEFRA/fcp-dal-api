import { createRequire } from 'node:module'
import { NotFound } from '../../../app/errors/graphql.js'
import { Business, BusinessCustomer } from '../../../app/graphql/resolvers/business/business.js'
import { transformOrganisationCPH } from '../../../app/transformers/rural-payments/business-cph.js'
import {
  transformBusinessCustomerPrivilegesToPermissionGroups,
  transformOrganisationCustomer,
  transformOrganisationCustomers
} from '../../../app/transformers/rural-payments/business.js'
import { organisationCPH } from '../../fixtures/organisation-cph.js'
import {
  organisationApplicationsByOrgId,
  organisationPeopleByOrgId
} from '../../fixtures/organisation.js'

const permissionGroups = createRequire(import.meta.url)(
  '../../../app/data-sources/static/permission-groups.json'
)

const dataSources = {
  permissions: {
    getPermissionGroups() {
      return permissionGroups
    }
  },
  ruralPaymentsBusiness: {
    getOrganisationCPHCollectionByOrganisationId() {
      return organisationCPH('5565448').data
    },
    getOrganisationCustomersByOrganisationId() {
      return organisationPeopleByOrgId('5565448')._data
    }
  },
  ruralPaymentsPortalApi: {
    getApplicationsCountrysideStewardship() {
      return organisationApplicationsByOrgId('5565448')
    }
  }
}

const mockBusiness = { organisationId: 'mockId' }

describe('Business', () => {
  it('land', () => {
    expect(Business.land(mockBusiness)).toEqual(mockBusiness)
  })

  it('cph', async () => {
    const cph = organisationCPH('5565448').data
    const transformed = transformOrganisationCPH(mockBusiness.organisationId, cph)
    expect(await Business.cphs(mockBusiness, null, { dataSources })).toEqual(transformed)
  })

  it('customers', async () => {
    const transformedData = transformOrganisationCustomers(
      organisationPeopleByOrgId('5565448')._data
    )
    expect(await Business.customers(mockBusiness, null, { dataSources })).toEqual(transformedData)
  })

  it('customer', async () => {
    const customer = organisationPeopleByOrgId('5565448')._data[0]
    const transformed = transformOrganisationCustomer(customer)

    expect(await Business.customer(mockBusiness, { crn: '1638563942' }, { dataSources })).toEqual(
      transformed
    )
  })

  it('handle customer not found', async () => {
    await expect(() =>
      Business.customer(mockBusiness, { crn: 'not-found' }, { dataSources })
    ).rejects.toEqual(new NotFound('Customer not found'))
  })
})

describe('BusinessCustomer', () => {
  it('permissionGroups', async () => {
    const customers = organisationPeopleByOrgId('5565448')._data
    for (const customer of customers) {
      const transformed = transformBusinessCustomerPrivilegesToPermissionGroups(
        customer.privileges,
        dataSources.permissions.getPermissionGroups()
      )

      expect(
        await BusinessCustomer.permissionGroups(
          {
            privileges: customer.privileges
          },
          null,
          {
            dataSources
          }
        )
      ).toEqual(transformed)
    }
  })
})
