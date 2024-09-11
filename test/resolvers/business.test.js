import {
  Business,
  BusinessCustomer
} from '../../app/graphql/resolvers/business/business.js'
import { createRequire } from 'node:module'

const permissionGroups = createRequire(import.meta.url)(
  '../../app/data-sources/static/permission-groups.json'
)

const dataSources = {
  permissions: {
    getPermissionGroups () {
      return permissionGroups
    }
  },
  ruralPaymentsBusiness: {
    getOrganisationCPHCollectionByOrganisationId () {
      return [
        { cphNumber: '10/327/0023', parcelNumbers: ['SS6927 1650'] },
        { cphNumber: '10/327/0022', parcelNumbers: [] },
        { cphNumber: '10/327/0025', parcelNumbers: [] }
      ]
    },
    getOrganisationCustomersByOrganisationId () {
      return [
        {
          id: 5263421,
          firstName: 'Nicholas',
          lastName: 'SANGSTER',
          customerReference: '9102634220',
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
          firstName: 'Ivan',
          lastName: 'Cook',
          customerReference: '9103020285',
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
          customerReference: '9103119648',
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
        }
      ]
    }
  },
  ruralPaymentsPortalApi: {
    getApplicationsCountrysideStewardship () {
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
  }
}

const mockBusiness = { organisationId: 'mockId' }

describe('Business', () => {
  it('land', () => {
    expect(Business.land(mockBusiness)).toEqual(mockBusiness)
  })

  it('cph', async () => {
    expect(await Business.cph(mockBusiness, null, { dataSources })).toEqual([
      {
        number: '10/327/0023',
        parcelNumbers: ['SS6927 1650'],
        organisationId: 'mockId'
      },
      { number: '10/327/0022', parcelNumbers: [], organisationId: 'mockId' },
      { number: '10/327/0025', parcelNumbers: [], organisationId: 'mockId' }
    ])
  })

  it('customers', async () => {
    expect(
      await Business.customers(mockBusiness, null, { dataSources })
    ).toEqual([
      {
        personId: 5263421,
        firstName: 'Nicholas',
        lastName: 'SANGSTER',
        crn: '9102634220',
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
        personId: 5302028,
        firstName: 'Ivan',
        lastName: 'Cook',
        crn: '9103020285',
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
        personId: 5311964,
        firstName: 'Trevor',
        lastName: 'Graham',
        crn: '9103119648',
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
      }
    ])
  })

  it('customer', async () => {
    expect(
      await Business.customer(
        mockBusiness,
        { crn: '9102634220' },
        { dataSources }
      )
    ).toEqual({
      personId: 5263421,
      firstName: 'Nicholas',
      lastName: 'SANGSTER',
      crn: '9102634220',
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
    })
  })

  it('applications', async () => {
    expect(
      await Business.applications(mockBusiness, null, { dataSources })
    ).toEqual([
      {
        applicationStatus: {
          frn: 0,
          id: 1641241,
          office: null,
          open: null,
          sector: null,
          status: 'Withdrawn',
          type: 'Countryside Stewardship (MT) Module 2023',
          year: 2023
        },
        csClaim: {
          lastMovement: '2023-08-08T16:16:27',
          schemaYear: 2023,
          status: 'WTHDRW',
          type: 'Countryside Stewardship (MT)'
        }
      },
      {
        applicationStatus: {
          frn: 0,
          id: 1646335,
          office: null,
          open: null,
          sector: 'STANDA',
          status: 'Agreement Live',
          type: 'Countryside Stewardship (MT) Module 2023',
          year: 2023
        },
        csClaim: {
          lastMovement: '2023-12-08T11:48:46',
          schemaYear: 2023,
          status: 'AGRLIV',
          type: 'Countryside Stewardship (MT)'
        }
      }
    ])
  })
})

describe('BusinessCustomer', () => {
  it('permissionGroups', async () => {
    expect(
      await BusinessCustomer.permissionGroups(
        {
          privileges: [
            'NO ACCESS - BPS - SA',
            'NO ACCESS - BPS',
            'VIEW - BPS - SA',
            'View - bps',
            'AMEND - BPS - SA',
            'Amend - bps',
            'SUBMIT - BPS - SA',
            'Submit - bps',
            'View - business',
            'Amend - business',
            'Make legal changes - business',
            'Full permission - business',
            'NO ACCESS - CS AGREE - SA',
            'NO ACCESS - CS AGREE',
            'VIEW - CS AGREE - SA',
            'View - cs agree',
            'AMEND - CS AGREE - SA',
            'Amend - cs agree',
            'SUBMIT - CS AGREE - SA',
            'Submit - cs agree',
            'NO ACCESS - CS APP - SA',
            'NO ACCESS - CS APP',
            'VIEW - CS APP - SA',
            'VIEW - CS APP',
            'AMEND - CS APP - SA',
            'Amend - cs app',
            'SUBMIT - CS APP - SA',
            'Submit - cs app',
            'NO ACCESS - ENTITLEMENT - SA',
            'NO ACCESS - ENTITLEMENT',
            'VIEW - ENTITLEMENT - SA',
            'View - entitlement',
            'AMEND - ENTITLEMENT - SA',
            'Amend - entitlement',
            'ELM_APPLICATION_NO_ACCESS',
            'ELM_APPLICATION_VIEW',
            'ELM_APPLICATION_AMEND',
            'ELM_APPLICATION_SUBMIT',
            'NO ACCESS - LAND - SA',
            'NO ACCESS - LAND',
            'VIEW - LAND - SA',
            'View - land',
            'AMEND - LAND - SA',
            'Amend - land'
          ]
        },
        null,
        {
          dataSources
        }
      )
    ).toEqual([
      {
        id: 'BASIC_PAYMENT_SCHEME',
        level: 'NO_ACCESS'
      },
      {
        id: 'BASIC_PAYMENT_SCHEME',
        level: 'VIEW'
      },
      {
        id: 'BASIC_PAYMENT_SCHEME',
        level: 'AMEND'
      },
      {
        id: 'BASIC_PAYMENT_SCHEME',
        level: 'SUBMIT'
      },
      {
        id: 'BUSINESS_DETAILS',
        level: 'VIEW'
      },
      {
        id: 'BUSINESS_DETAILS',
        level: 'AMEND'
      },
      {
        id: 'BUSINESS_DETAILS',
        level: 'MAKE_LEGAL_CHANGES'
      },
      {
        id: 'BUSINESS_DETAILS',
        level: 'FULL_PERMISSION'
      },
      {
        id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS',
        level: 'NO_ACCESS'
      },
      {
        id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS',
        level: 'VIEW'
      },
      {
        id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS',
        level: 'AMEND'
      },
      {
        id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS',
        level: 'SUBMIT'
      },
      {
        id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS',
        level: 'NO_ACCESS'
      },
      {
        id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS',
        level: 'VIEW'
      },
      {
        id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS',
        level: 'AMEND'
      },
      {
        id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS',
        level: 'SUBMIT'
      },
      {
        id: 'ENTITLEMENTS',
        level: 'NO_ACCESS'
      },
      {
        id: 'ENTITLEMENTS',
        level: 'VIEW'
      },
      {
        id: 'ENTITLEMENTS',
        level: 'AMEND'
      },
      {
        id: 'ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS',
        level: 'NO_ACCESS'
      },
      {
        id: 'ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS',
        level: 'VIEW'
      },
      {
        id: 'ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS',
        level: 'AMEND'
      },
      {
        id: 'ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS',
        level: 'SUBMIT'
      },
      {
        id: 'LAND_DETAILS',
        level: 'NO_ACCESS'
      },
      {
        id: 'LAND_DETAILS',
        level: 'VIEW'
      },
      {
        id: 'LAND_DETAILS',
        level: 'AMEND'
      }
    ])
  })
})
