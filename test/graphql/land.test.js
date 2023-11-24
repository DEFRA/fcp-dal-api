import { deepEqual } from 'assert'

import { graphql } from 'graphql'

import { schema } from '../../app/graphql/server.js'
import { context } from '../../app/graphql/context.js'

describe('Query.land', () => {
  it('should return land data', async () => {
    const result = await graphql({
      source: `#graphql
        query TestLand($businessId: ID!) {
          land(businessId: $businessId) {
            sbi
            summary {
              numberOfParcels
              totalArea
            }
            parcels {
              id
              area
              covers {
                  id
                  classCode
                  description
                  area
              }
            }
          }
        }
      `,
      variableValues: {
        businessId: '807294898'
      },
      schema,
      contextValue: await context()
    })

    deepEqual(result, {
      data: {
        land: {
          sbi: '807294898',
          summary: { numberOfParcels: 2, totalArea: 3.6571630106587865 },
          parcels: [
            {
              id: '7154931',
              area: 3.1161916585340657,
              covers: [
                {
                  id: '11033654',
                  classCode: 130,
                  description: 'PERMANENT_GRASSLAND',
                  area: 3.1161916585340657
                }
              ]
            },
            {
              id: '6953379',
              area: 0.5409713521247209,
              covers: [
                {
                  id: '10409591',
                  classCode: 131,
                  description: 'PERMANENT_GRASSLAND',
                  area: 0.5409713521247209
                }
              ]
            }
          ]
        }
      }
    })
  })
})
