import { faker } from '@faker-js/faker/locale/en_GB'
import logger from '../../app/utils/logger.js'
import files from '../utils/files.js'

const { getJSON } = files(import.meta.url)

const generateCHPMock = () => ({
  cphNumber: faker.string.alphanumeric(),
  parcelNumbers: [faker.string.alphanumeric(), faker.string.alphanumeric(), faker.string.alphanumeric()]
})

const generateCHPInfoMock = (attributes = {}) => ({
  cphNumber: faker.string.alphanumeric(),
  parish: faker.string.alphanumeric(),
  startDate: faker.date.anytime().getDate() * 1000,
  expiryDate: faker.date.anytime().getDate() * 1000,
  species: [faker.string.alphanumeric().toUpperCase()],
  xCoordinate: faker.number.int({ max: 216000, min: 116000 }),
  yCoordinate: faker.number.int({ max: 621000, min: 236000 }),
  ...attributes
})

export const organisationCPHInfo = orgId => {
  try {
    return getJSON(`./orgId/${orgId}/cph-info.json`)
  } catch (error) {
    logger.debug('#Mock #Fixtures #organisationCPHInfo - Generating mock data')
    faker.seed(+orgId)
    return {
      data: generateCHPInfoMock()
    }
  }
}

export const organisationCPH = orgId => {
  try {
    return getJSON(`./orgId/${orgId}/cph.json`)
  } catch (error) {
    logger.debug('#Mock #Fixtures #organisationCPH - Generating mock data')
    faker.seed(+orgId)
    return {
      data: [generateCHPMock()]
    }
  }
}
