import { faker } from '@faker-js/faker/locale/en_GB'
import logger from '../../app/utils/logger.js'
import files from '../utils/files.js'

const { getJSON } = files(import.meta.url)

const createPersonMock = (attributes = {}) => ({
  title: faker.person.prefix(),
  otherTitle: null,
  firstName: faker.person.firstName(),
  middleName: faker.person.middleName(),
  lastName: faker.person.lastName(),
  dateOfBirth: faker.date.birthdate(),
  landline: null,
  fax: null,
  mobile: faker.string.numeric(10),
  email: faker.internet.email(),
  doNotContact: false,
  emailValidated: false,
  address: {
    pafOrganisationName: null,
    flatName: null,
    buildingNumberRange: null,
    buildingName: faker.location.buildingNumber(),
    street: faker.location.street(),
    city: faker.location.city(),
    county: faker.location.county(),
    postalCode: faker.location.zipCode(),
    country: 'United Kingdom',
    uprn: null,
    dependentLocality: null,
    doubleDependentLocality: null,
    addressTypeId: null
  },
  locked: false,
  id: faker.string.numeric(7),
  confirmed: null,
  customerReferenceNumber: faker.string.numeric(10),
  personalIdentifiers: null,
  deactivated: false,
  ...attributes
})

export const personById = (attributes = {}) => {
  try {
    return getJSON(`./personId/${attributes.id}/detail.json`)
  } catch (error) {
    logger.debug('#Mock #Fixtures #personById - Generating mock data')
    const seedReference = attributes.customerReferenceNumber || attributes.id
    if (seedReference) {
      faker.seed(+seedReference)
    }
    return {
      _data: createPersonMock(attributes)
    }
  }
}
