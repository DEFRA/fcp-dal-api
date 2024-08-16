import { transformOrganisationCSApplicationToBusinessApplications } from '../../../app/transformers/rural-payments/applications-cs.js'

describe('transformOrganisationCSApplicationToBusinessApplications Test', () => {
  const systemUnderTest =
    transformOrganisationCSApplicationToBusinessApplications

  describe('given payload has no applications defined', () => {
    const actual = systemUnderTest(null)

    test('it should return a JSON with applications field and an empty array', () => {
      expect(actual).toEqual([])
    })
  })

  describe('given payload has applications defined as an empty array', () => {
    const actual = systemUnderTest(null)

    test('it should return a JSON with applications field and an empty array', () => {
      expect(actual).toEqual([])
    })
  })

  describe('given payload has two applications defined', () => {
    const actual = systemUnderTest([
      {
        application_id: 1648168,
        application_code: null,
        status: 'Withdrawn',
        application_type_de: 'Countryside Stewardship (MT) Module 2023',
        workflow_context_sub_code: null,
        year: 2023,
        has_hefer_intersection_y: 0,
        office: null,
        application_type_ds: 'Countryside Stewardship (MT)',
        status_sub_code: 'WTHDRW',
        application_movement_date: '2023-08-17T10:38:49'
      },
      {
        application_id: 1649461,
        application_code: null,
        status: 'Checking Application',
        application_type_de: 'Countryside Stewardship (MT) Module 2023',
        workflow_context_sub_code: 'STANDA',
        year: 2023,
        has_hefer_intersection_y: 0,
        office: null,
        application_type_ds: 'Countryside Stewardship (MT)',
        status_sub_code: 'AGROFF',
        application_movement_date: '2023-09-20T14:21:36'
      }
    ])

    test('it should return an enrich JSON with applications populated', () => {
      expect(actual).toEqual([
        {
          applicationStatus: {
            id: 1648168,
            open: null,
            status: 'Withdrawn',
            type: 'Countryside Stewardship (MT) Module 2023',
            sector: null,
            year: 2023,
            frn: 0,
            office: null
          },
          csClaim: {
            schemaYear: 2023,
            type: 'Countryside Stewardship (MT)',
            status: 'WTHDRW',
            lastMovement: '2023-08-17T10:38:49'
          }
        },
        {
          applicationStatus: {
            id: 1649461,
            open: null,
            status: 'Checking Application',
            type: 'Countryside Stewardship (MT) Module 2023',
            sector: 'STANDA',
            year: 2023,
            frn: 0,
            office: null
          },
          csClaim: {
            schemaYear: 2023,
            type: 'Countryside Stewardship (MT)',
            status: 'AGROFF',
            lastMovement: '2023-09-20T14:21:36'
          }
        }
      ])
    })
  })
})
