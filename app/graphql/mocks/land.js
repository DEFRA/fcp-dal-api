import { faker } from '@faker-js/faker/locale/en_GB'

export const Land = {
  summary: {
    date: faker.date.anytime().toUTCString(),
    numberOfParcels: faker.number.int(),
    totalArea: faker.number.float(),
    mapImageData: faker.lorem.text(),
    permanentGrassland: faker.number.float()
  }
}
