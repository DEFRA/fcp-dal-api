import { faker } from '@faker-js/faker/locale/en_GB'

export const Date = () => (faker.date.anytime().toString())

export const Image = () => (faker.number.hex())

export const Numeric = () => (faker.number.int())
