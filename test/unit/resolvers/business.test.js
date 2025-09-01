import { expect, jest } from '@jest/globals'
import { createRequire } from 'node:module'
import { describe } from 'node:test'
import { NotFound } from '../../../app/errors/graphql.js'
import { Business, BusinessCustomer } from '../../../app/graphql/resolvers/business/business.js'
import {
  transformBusinessCustomerPrivilegesToPermissionGroups,
  transformOrganisationCustomer,
  transformOrganisationCustomers
} from '../../../app/transformers/rural-payments/business.js'
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
    getOrganisationCustomersByOrganisationId() {
      return organisationPeopleByOrgId('5565448')._data
    },
    getCountyParishHoldingsBySBI: jest.fn(),
    getAgreementsBySBI: jest.fn(),
    getApplicationsBySBI: jest.fn()
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

  it('countyParishHoldings', async () => {
    dataSources.ruralPaymentsBusiness.getCountyParishHoldingsBySBI.mockImplementationOnce(
      async () => [
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
        }
      ]
    )

    expect(
      await Business.countyParishHoldings({ sbi: 'mockSbi' }, undefined, {
        dataSources
      })
    ).toEqual([
      {
        address: 'mockAddress',
        cphNumber: 'mockCph1',
        endDate: '2021-03-20',
        parish: 'mockParish',
        species: 'mockSpecies',
        startDate: '2020-03-20',
        xCoordinate: 123456,
        yCoordinate: 654321
      }
    ])

    expect(dataSources.ruralPaymentsBusiness.getCountyParishHoldingsBySBI).toHaveBeenCalledWith(
      'mockSbi'
    )
  })

  it('agreements', async () => {
    dataSources.ruralPaymentsBusiness.getAgreementsBySBI.mockImplementationOnce(async () => [
      {
        contract_id: 'mockContractId',
        agreement_name: 'mockAgreementName',
        status: 'mockStatus',
        contract_type: 'mockContractType',
        scheme_year: 'mockSchemeYear',
        start_date: '2020-01-01T00:00:00.000Z',
        end_date: '2020-12-31T00:00:00.000Z',
        payment_schedules: [
          {
            option_code: 'mockOptionCode',
            option_description: 'mockOptionDescription',
            commitment_group_start_date: '2020-01-01T00:00:00.000Z',
            commitment_group_end_date: '2020-12-31T00:00:00.000Z',
            year: '2020',
            sheet_name: 'mockSheetName',
            parcel_name: 'mockParcelName',
            action_area: 1654,
            action_mtl: 'mockActionMTL',
            action_units: 'mockActionUnits',
            parcel_total_area: 9876,
            payment_schedule_start_date: '2020-01-01T00:00:00.000Z',
            payment_schedule_end_date: '2020-12-31T00:00:00.000Z'
          }
        ]
      }
    ])

    const agreements = await Business.agreements({ sbi: 'mockSbi' }, undefined, {
      dataSources
    })

    expect(agreements).toEqual([
      {
        contractId: 'mockContractId',
        name: 'mockAgreementName',
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
            actionArea: 0.1654,
            actionMTL: 'mockActionMTL',
            actionUnits: 'mockActionUnits',
            parcelTotalArea: 0.9876,
            startDate: '2020-01-01T00:00:00.000Z',
            endDate: '2020-12-31T00:00:00.000Z'
          }
        ]
      }
    ])
  })

  describe('applications', () => {
    it('should return applications list for specified SBI', async () => {
      dataSources.ruralPaymentsBusiness.getApplicationsBySBI.mockResolvedValueOnce([
        {
          sbi: 'mock-sbi',
          subject_id: 404,
          year: 2015,
          application_name: 'app name',
          module_code: 'module code',
          scheme: 'scheme',
          application_id: 101,
          status_code_p: 'code p',
          status_code_s: 'code s',
          status: 'status',
          submission_date: '2015-09-16T10:50:01:001+0100',
          portal_status_p: 'status p',
          portal_status_s: 'status s',
          portal_status: 'portal status',
          fg_active: 'Yes',
          transition_id: 187,
          transition_name: 'transition name',
          agreement_ref: '42,17, 111',
          application_history: [
            {
              transition_id: 187,
              transition_name: 'transition name',
              dt_transition: '2018-10-26T08:05:54:054+0100',
              check_status: 'check status'
            }
          ]
        }
      ])

      const applications = await Business.applications({ sbi: 'mock-sbi' }, undefined, {
        dataSources
      })

      expect(applications).toEqual([
        {
          sbi: 'mock-sbi',
          id: 101,
          subjectId: 404,
          year: 2015,
          name: 'app name',
          moduleCode: 'module code',
          scheme: 'scheme',
          statusCodeP: 'code p',
          statusCodeS: 'code s',
          status: 'status',
          submissionDate: new Date('2015-09-16T10:50:01.001+0100').toISOString(),
          portalStatusP: 'status p',
          portalStatusS: 'status s',
          portalStatus: 'portal status',
          active: true,
          transitionId: 187,
          transitionName: 'transition name',
          agreementReferences: ['42', '17', '111'],
          transitionHistory: [
            {
              id: 187,
              name: 'transition name',
              timestamp: new Date('2018-10-26T08:05:54.054+0100').toISOString(),
              checkStatus: 'check status'
            }
          ]
        }
      ])
    })
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
