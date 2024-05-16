import { faker } from '@faker-js/faker/locale/en_GB'
import logger from '../../app/utils/logger.js'
import files from '../utils/files.js'
import { createOrganisationPersonSummaryMock } from './organisation.js'
const { getJSON } = files(import.meta.url)

export const organisationPersonSummary = (attributes = {}) => {
  try {
    return getJSON(`./personId/${attributes.id}/organisationSummary.json`)
  } catch (error) {
    logger.debug('#Mock #Fixtures #organisationPersonSummary - Generating mock data')
    const seedReference = `${attributes.id}${attributes.sbi || 0}`
    faker.seed(+seedReference)
    return {
      _data: [createOrganisationPersonSummaryMock(attributes)]
    }
  }
}
