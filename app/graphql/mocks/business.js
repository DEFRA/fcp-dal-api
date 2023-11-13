import { faker } from '@faker-js/faker/locale/en_GB'

export const Business = {
  id: faker.string.alphanumeric({ length: 10, casing: 'upper' }),
  landManagement: {
    summary: {
      date: 'ssss',
      numberOfParcels: faker.number.int(),
      totalArea: faker.number.float(),
      mapImageData: faker.lorem.text(),
      permanentGrassland: faker.number.float()
    }
  }
}
