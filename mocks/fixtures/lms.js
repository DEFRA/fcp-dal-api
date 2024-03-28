import { faker } from '@faker-js/faker/locale/en_GB'
import files from '../utils/files.js'

const { getJSON } = files(import.meta.url)

const generateCoversSummaryMock = areaIndex => [
  {
    code: '110',
    name: 'Arable Land',
    area: !areaIndex || areaIndex === 1 ? faker.number.float({ min: 0, max: 1000, precision: 0.01 }) : 0
  },
  {
    code: '130',
    name: 'Permanent Grassland',
    area: !areaIndex || areaIndex === 2 ? faker.number.float({ min: 0, max: 1000, precision: 0.01 }) : 0
  },
  {
    code: '140',
    name: 'Permanent Crops',
    area: !areaIndex || areaIndex === 3 ? faker.number.float({ min: 0, max: 1000, precision: 0.01 }) : 0
  }
]

const generateLandParcelsMock = () => {
  return [...Array(faker.number.int(20))].map((_, i) => ({
    id: faker.string.numeric(7),
    sheetId: `S${faker.string.numeric(5)}`,
    parcelId: faker.string.numeric(4),
    area: faker.number.float({ min: 0, max: 1000, precision: 0.01 }),
    pendingDigitisation: faker.datatype.boolean()
  }))
}

export const coversSummary = orgId => {
  try {
    return getJSON(`./orgId/${orgId}/covers-summary.json`)
  } catch (error) {
    faker.seed(+orgId)
    return generateCoversSummaryMock()
  }
}

export const parcelSummary = orgId => {
  try {
    return getJSON(`./orgId/${orgId}/parcel-summary.json`)
  } catch (error) {
    faker.seed(+orgId)
    const totalParcels = faker.number.int({ min: 1, max: 50 })
    const totalArea = faker.number.float({ min: 0, max: 1000, precision: 0.01 })
    return {
      totalParcels,
      totalArea
    }
  }
}

export const landCovers = orgId => {
  try {
    return getJSON(`./orgId/${orgId}/land-covers.json`)
  } catch (error) {
    faker.seed(+orgId)
    return [...Array(faker.number.int(20))].map(() => ({
      id: faker.string.numeric(10),
      info: generateCoversSummaryMock(faker.number.int({ min: 1, max: 3 }))
    }))
  }
}

export const landParcels = orgId => {
  try {
    return getJSON(`./orgId/${orgId}/land-parcels.json`)
  } catch (error) {
    faker.seed(+orgId)
    return generateLandParcelsMock()
  }
}
