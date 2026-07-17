import { expect, jest } from '@jest/globals'
import { createRequire } from 'node:module'
import { describe } from 'node:test'
import { NotFound } from '../../../../app/errors/graphql.js'
import { Business, BusinessCustomer } from '../../../../app/graphql/resolvers/business/business.js'
import {
  transformBusinessCustomerPrivilegesToPermissionGroups,
  transformOrganisationCustomer,
  transformOrganisationCustomers
} from '../../../../app/transformers/rural-payments/business.js'

const permissionGroups = createRequire(import.meta.url)(
  '../../../../app/data-sources/static/permission-groups.json'
)

const logger = {
  warn: jest.fn()
}

const dataSources = {
  permissions: {
    getPermissionGroups() {
      return permissionGroups
    }
  },

  ruralPaymentsBusiness: {
    getOrganisationCustomersByOrganisationId() {
      return [
        {
          id: 5263421,
          firstName: 'Nicholas',
          lastName: 'SANGSTER',
          customerReference: '1638563942',
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
          customerReference: '2446747270',
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
          customerReference: '4804081228',
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
          customerReference: '6148241575',
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
    },
    getCountyParishHoldingsBySBI: jest.fn(),
    getAgreementsBySBI: jest.fn(),
    getApplicationsBySBI: jest.fn(),
    getAuthorisedFunctionsByOrganisationId: jest.fn(),
    getOrganisationById: jest.fn()
  },

  ruralPaymentsPortalApi: {
    getApplicationsCountrysideStewardship() {
      return {
        applications: [
          {
            application_id: 1641241,
            year: 2023,
            sector_description: 'PILLAR II (2014-2020)',
            module_id: 535,
            modcod: null,
            application_type_ds: 'Countryside Stewardship (MT)',
            application_type_de: 'Countryside Stewardship (MT) Module 2023',
            status_code: 'STADOM',
            status_sub_code: 'WTHDRW',
            status_description: 'WITHDRAWN',
            active_application_flag: false,
            application_movement_date: '2023-08-08T16:16:27',
            application_code: null,
            workflow_context_sub_code: null,
            needs_intervention: false,
            show_withdraw: false,
            show_accept: false,
            submit_date: null,
            status: 'Withdrawn',
            common_lands_flag: false,
            prints_count: 4,
            queued: false,
            has_sssi_intersection_c: 0,
            has_sssi_intersection_y: 0,
            has_hefer_intersection_y: 0,
            has_been_AGRLIV: 0,
            ter_closing_date: '2023-10-07T00:00:00',
            eligibIntersections: null,
            required_sssi_approval: false
          },
          {
            application_id: 1646335,
            year: 2023,
            sector_description: 'PILLAR II (2014-2020)',
            module_id: 535,
            modcod: null,
            application_type_ds: 'Countryside Stewardship (MT)',
            application_type_de: 'Countryside Stewardship (MT) Module 2023',
            status_code: 'STADOM',
            status_sub_code: 'AGRLIV',
            status_description: 'AGREEMENT LIVE',
            active_application_flag: true,
            application_movement_date: '2023-12-08T11:48:46',
            application_code: null,
            workflow_context_sub_code: 'STANDA',
            needs_intervention: false,
            show_withdraw: false,
            show_accept: true,
            submit_date: '2023-08-09T11:47:07',
            status: 'Agreement Live',
            common_lands_flag: false,
            prints_count: 4,
            queued: false,
            has_sssi_intersection_c: 0,
            has_sssi_intersection_y: 0,
            has_hefer_intersection_y: 0,
            has_been_AGRLIV: 1,
            ter_closing_date: '2023-10-07T00:00:00',
            eligibIntersections: null,
            required_sssi_approval: false
          }
        ]
      }
    }
  },
  mongoBusiness: {
    getOrgIdBySbi: jest.fn(),
    upsertOrgIdBySbi: jest.fn()
  }
}

const mockBusiness = { organisationId: 'mockId' }

describe('Business', () => {
  it('land', () => {
    expect(Business.land(mockBusiness)).toEqual(mockBusiness)
  })

  it('customers', async () => {
    const transformedData = transformOrganisationCustomers([
      {
        id: 5263421,
        firstName: 'Nicholas',
        lastName: 'SANGSTER',
        customerReference: '1638563942',
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
        customerReference: '2446747270',
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
        customerReference: '4804081228',
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
        customerReference: '6148241575',
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
    ])
    expect(await Business.customers(mockBusiness, null, { dataSources })).toEqual(transformedData)
  })

  it('customer', async () => {
    const customer = {
      id: 5263421,
      firstName: 'Nicholas',
      lastName: 'SANGSTER',
      customerReference: '1638563942',
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
    }
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

  it('info - internal gateway should return transformed business data when found', async () => {
    const organisationId = '1'
    const mockOrganisation = { id: '1', name: 'Test Farm' }

    dataSources.ruralPaymentsBusiness.getOrganisationById.mockResolvedValue(mockOrganisation)

    const result = await Business.info({ organisationId }, undefined, { dataSources, logger })

    expect(dataSources.ruralPaymentsBusiness.getOrganisationById).toHaveBeenCalledWith(
      mockOrganisation.id
    )
    expect(result).toEqual({
      name: 'Test Farm',
      reference: undefined,
      vat: undefined,
      traderNumber: undefined,
      vendorNumber: undefined,
      additionalBusinessActivities: [],
      additionalSbis: [],
      address: {
        line1: undefined,
        line2: undefined,
        line3: undefined,
        line4: undefined,
        line5: undefined,
        pafOrganisationName: undefined,
        buildingNumberRange: undefined,
        buildingName: undefined,
        flatName: undefined,
        street: undefined,
        city: undefined,
        county: undefined,
        postalCode: undefined,
        country: undefined,
        uprn: undefined,
        dependentLocality: undefined,
        doubleDependentLocality: undefined,
        typeId: undefined
      },
      correspondenceAddress: null,
      correspondencePhone: { mobile: undefined, landline: undefined, fax: undefined },
      phone: { mobile: undefined, landline: undefined, fax: undefined },
      dateStartedFarming: null,
      email: { address: undefined, validated: undefined },
      correspondenceEmail: { address: undefined, validated: false },
      hasAdditionalBusinessActivities: false,
      hasLandInNorthernIreland: false,
      hasLandInScotland: false,
      hasLandInWales: false,
      isAccountablePeopleDeclarationCompleted: false,
      isCorrespondenceAsBusinessAddress: false,
      isFinancialToBusinessAddress: false,
      landConfirmed: false,
      lastUpdated: null,
      legalStatus: { code: undefined, type: undefined },
      type: { code: undefined, type: undefined },
      registrationNumbers: { companiesHouse: undefined, charityCommission: undefined },
      status: {
        locked: false,
        deactivated: false,
        confirmed: false
      }
    })
  })

  it('should handle errors from dataSource for internal gateway', async () => {
    const sbi = '123456789'
    const error = new Error('Database error')
    dataSources.ruralPaymentsBusiness.getOrganisationById.mockRejectedValue(error)

    await expect(Business.info({ sbi }, undefined, { dataSources, logger })).rejects.toThrow(error)
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

  describe('permittedFunctions', () => {
    it('maps each requested function to its upstream authorisation flag, in order', async () => {
      dataSources.ruralPaymentsBusiness.getAuthorisedFunctionsByOrganisationId.mockResolvedValueOnce(
        {
          viewLand: true,
          amendBusinessDetails: false
        }
      )

      const result = await Business.permittedFunctions(
        { organisationId: 'mockId' },
        { functions: ['viewLand', 'amendBusinessDetails'] },
        { dataSources }
      )

      expect(
        dataSources.ruralPaymentsBusiness.getAuthorisedFunctionsByOrganisationId
      ).toHaveBeenCalledWith('mockId', ['viewLand', 'amendBusinessDetails'])
      expect(result).toEqual([
        { name: 'viewLand', permitted: true },
        { name: 'amendBusinessDetails', permitted: false }
      ])
    })

    it('defaults to not permitted when the upstream omits a requested function', async () => {
      dataSources.ruralPaymentsBusiness.getAuthorisedFunctionsByOrganisationId.mockResolvedValueOnce(
        {
          viewLand: true
        }
      )

      const result = await Business.permittedFunctions(
        { organisationId: 'mockId' },
        { functions: ['viewLand', 'someUnknownFunction'] },
        { dataSources }
      )

      expect(result).toEqual([
        { name: 'viewLand', permitted: true },
        { name: 'someUnknownFunction', permitted: false }
      ])
    })
  })
})

describe('BusinessCustomer', () => {
  it('permissionGroups', async () => {
    const customers = [
      {
        id: 5263421,
        firstName: 'Nicholas',
        lastName: 'SANGSTER',
        customerReference: '1638563942',
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
        customerReference: '2446747270',
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
        customerReference: '4804081228',
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
        customerReference: '6148241575',
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
