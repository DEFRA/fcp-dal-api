import { faker } from '@faker-js/faker/locale/en_GB'

function generateCoversSummary (onlyOneArea = false) {
  const randomIndex = faker.number.int({ min: 0, max: 2 })

  const data = [
    {
      code: '110',
      name: 'Arable Land'
    },
    {
      code: '130',
      name: 'Permanent Grassland'
    },
    {
      code: '140',
      name: 'Permanent Crops'
    }
  ]

  return data.map((item, index) => {
    const area = faker.number.float({ min: 0, max: 1000, precision: 0.01 })

    return ({
      ...item,
      area: onlyOneArea ? (index === randomIndex ? area : 0) : area
    })
  })
}

export const coversSummary = generateCoversSummary()

export const totalParcels = faker.number.int({ min: 1, max: 50 })

export const totalArea = faker.number.float({ min: 0, max: 1000, precision: 0.01 })

export const landCovers = [...Array(faker.number.int(20))].map(() => ({
  id: faker.string.numeric(10),
  info: generateCoversSummary(true)
}))

export const landParcels = [...Array(faker.number.int(20))].map((_, i) => {
  return {
    id: faker.string.numeric(7),
    sheetId: `S${faker.string.numeric(5)}`,
    parcelId: faker.string.numeric(4),
    area: faker.number.float({ min: 0, max: 1000, precision: 0.01 }),
    pendingDigitisation: faker.datatype.boolean()
  }
})
