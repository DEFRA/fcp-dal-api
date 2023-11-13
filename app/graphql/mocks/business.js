import { faker } from '@faker-js/faker/locale/en_GB'
import { LandManagement } from './land.js'

export const Business = {
  id: faker.string.alphanumeric({ length: 10, casing: 'upper' }),
  landManagement: LandManagement
}
