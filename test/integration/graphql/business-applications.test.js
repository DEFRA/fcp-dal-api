import { graphql } from 'graphql/index.js'
import { schema } from '../../../app/graphql/server.js'
import { fakeContext } from '../../test-setup.js'

describe('Query businessApplications', () => {
  it('should return application data', async () => {
    const result = await graphql({
      source: `#graphql
      query BusinessApplications {
          businessApplications(id: "5444918") {
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
      `,
      variableValues: {
        id: '5444918'
      },
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: {
        businessApplications: [
          {
            applicationStatus: {
              id: expect.any(String),
              open: null,
              status: 'Withdrawn',
              type: expect.any(String),
              sector: null,
              year: 2023,
              frn: expect.any(String),
              office: null
            },
            csClaim: {
              schemaYear: 2023,
              type: expect.any(String),
              status: 'WTHDRW',
              lastMovement: expect.any(String)
            }
          },
          {
            applicationStatus: {
              id: expect.any(String),
              open: null,
              status: 'Withdrawn',
              type: expect.any(String),
              sector: null,
              year: 2023,
              frn: expect.any(String),
              office: null
            },
            csClaim: {
              schemaYear: 2023,
              type: expect.any(String),
              status: 'WTHDRW',
              lastMovement: expect.any(String)
            }
          }
        ]
      }
    })
  })
})
