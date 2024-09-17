import { graphql } from 'graphql/index.js'
import { schema } from '../../../app/graphql/server.js'
import { fakeContext } from '../../test-setup.js'
import mockServer from '../../../mocks/server'

beforeAll(mockServer.start)
afterAll(mockServer.stop)

describe('Query business.applications', () => {
  it('should return application data', async () => {
    const result = await graphql({
      source: `#graphql
        query BusinessApplications {
          business(sbi: "890000001") {
            applications {
              applicationStatus {
                id
                open
                status
                type
                sector
                year
                frn
                office
              }
              csClaim {
                schemaYear
                type
                status
                lastMovement
              }
            }
          }
        }
      `,
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: {
        business: {
          applications: [
            {
              applicationStatus: {
                frn: '0',
                id: '1641241',
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
                frn: '0',
                id: '1646335',
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
          ]
        }
      }
    })
  })
})
