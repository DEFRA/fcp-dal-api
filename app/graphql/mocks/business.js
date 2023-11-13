import { faker } from '@faker-js/faker/locale/en_GB'

export const Business = {
  id: faker.string.alphanumeric({ length: 10, casing: 'upper' }),
}
