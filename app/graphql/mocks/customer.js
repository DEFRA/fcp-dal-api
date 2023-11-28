import { faker } from '@faker-js/faker/locale/en_GB'

export const CustomerName = () => ({
  title: faker.person.prefix(),
  otherTitle: faker.person.prefix(),
  first: faker.person.firstName(),
  middle: faker.person.middleName(),
  last: faker.person.lastName()
})

export const CustomerStatus = () => ({
  locked: faker.datatype.boolean(),
  confirmed: faker.datatype.boolean(),
  deactivated: faker.datatype.boolean()
})

export const CustomerAuthenticationQuestions = () => ({
  memorableDate: faker.lorem.sentence(),
  memorableEvent: faker.lorem.sentence(),
  memorablePlace: faker.lorem.sentence()
})

export const Customer = () => {
  return {
    id: faker.string.alphanumeric({ length: 10, casing: 'upper' })
  }
}

export const CustomerInfo = () => {
  return {
    dateOfBirth: faker.string.numeric()
  }
}
