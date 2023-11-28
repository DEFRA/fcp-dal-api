import { faker } from '@faker-js/faker/locale/en_GB'

export default [
  {
    id: 'rpp-lms-get-land-covers',
    url: '/rpp/viewland/lms/lms/organisation/:orgId/land-covers/historic/171123',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'json',
        options: {
          status: 200,
          body: [...Array(faker.number.int(20))].map((_, i) => {
            return {
              id: faker.string.numeric(10),
              info: [
                {
                  code: '110',
                  name: 'Arable Land',
                  area: faker.number.float({ min: 0, max: 1000, precision: 0.01 })
                },
                {
                  code: '130',
                  name: 'Permanent Grassland',
                  area: faker.number.float({ min: 0, max: 1000, precision: 0.01 })
                },
                {
                  code: '140',
                  name: 'Permanent Crops',
                  area: faker.number.float({ min: 0, max: 1000, precision: 0.01 })
                }
              ]
            }
          })
        }
      }
    ]
  },
  {
    id: 'rpp-lms-get-parcels',
    url: '/rpp/viewland/lms/lms/organisation/:orgId/parcels',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'json',
        options: {
          status: 200,
          body: [...Array(faker.number.int(20))].map((_, i) => {
            return {
              id: parseInt(faker.string.numeric(7)),
              sheetId: `S${faker.string.numeric(5)}`,
              parcelId: faker.string.numeric(4),
              area: faker.number.float({ min: 0, max: 1000, precision: 0.01 }),
              pendingDigitisation: faker.datatype.boolean()
            }
          })
        }
      }
    ]
  }
]
