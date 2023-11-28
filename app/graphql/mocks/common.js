import { faker } from '@faker-js/faker/locale/en_GB'

export const Phone = () => ({
  mobile: faker.phone.number(),
  landline: faker.phone.number(),
  fax: faker.phone.number()
})

export const Email = () => ({
  address: faker.internet.email(),
  validated: faker.datatype.boolean(),
  doNotContact: faker.datatype.boolean()
})

export const Address = () => ({
  pafOrganisationName: null,
  buildingNumberRange: faker.location.secondaryAddress(),
  buildingName: faker.location.secondaryAddress(),
  flatName: faker.location.secondaryAddress(),
  street: faker.location.street(),
  city: faker.location.city(),
  county: faker.location.state(),
  postalCode: faker.location.zipCode(),
  country: faker.location.country(),
  uprn: null,
  dependentLocality: null,
  doubleDependentLocality: null,
  typeId: null
})
