import { faker } from '@faker-js/faker/locale/en_GB'
import files from '../utils/files.js'

const { getJSON } = files(import.meta.url)

const createOrganisationMock = (attributes = {}) => ({
  id: faker.string.numeric(7),
  name: faker.company.name(),
  sbi: parseInt(faker.string.numeric(9)),
  confirmed: false,
  deactivated: false,
  locked: false,
  address: {
    address1: null,
    address2: null,
    address3: null,
    address4: null,
    address5: null,
    pafOrganisationName: null,
    flatName: null,
    buildingNumberRange: null,
    buildingName: null,
    street: null,
    city: faker.location.city(),
    county: null,
    postalCode: faker.location.zipCode(),
    country: 'United Kingdom',
    uprn: faker.string.numeric(12),
    dependentLocality: null,
    doubleDependentLocality: null,
    addressTypeId: null
  },
  email: faker.internet.email(),
  emailValidated: false,
  doNotContact: false,
  landline: faker.phone.number(),
  mobile: null,
  fax: null,
  businessType: {
    id: faker.number.int({ min: 164946, max: 964946 }),
    type: 'Not Specified'
  },
  businessReference: faker.string.numeric(10),
  legalStatus: {
    id: faker.number.int({ min: 164946, max: 964946 }),
    type: 'Sole Proprietorship'
  },
  companiesHouseRegistrationNumber: null,
  charityCommissionRegistrationNumber: null,
  ...attributes
})

const createOrganisationPeopleMock = (attributes = {}) => ({
  id: faker.number.int({ min: 1649461, max: 9649461 }),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  customerReference: faker.string.numeric(10),
  confirmed: faker.datatype.boolean(),
  lastUpdatedOn: faker.date.anytime().getDate(),
  role: 'Business Partner',
  privileges: [
    'Full permission - business',
    'Amend - land',
    'Amend - entitlement',
    'Submit - bps',
    'SUBMIT - BPS - SA',
    'AMEND - ENTITLEMENT - SA',
    'AMEND - LAND - SA'
  ].filter(() => faker.datatype.boolean()),
  ...attributes
})

const createOrganisationApplicationMock = (attributes = {}) => ({
  application_id: faker.number.int({ min: 1649461, max: 9649461 }),
  year: 2023,
  sector_description: faker.string.alphanumeric(),
  module_id: faker.number.int(),
  modcod: null,
  application_type_ds: faker.string.alphanumeric(),
  application_type_de: faker.string.alphanumeric(),
  status_code: 'STADOM',
  status_sub_code: 'WTHDRW',
  status_description: 'WITHDRAWN',
  active_application_flag: false,
  application_movement_date: faker.date.anytime().toUTCString(),
  application_code: null,
  workflow_context_sub_code: null,
  needs_intervention: false,
  show_accept: false,
  submit_date: null,
  status: 'Withdrawn',
  common_lands_flag: false,
  prints_count: faker.number.int({ min: 0, max: 20 }),
  queued: false,
  has_sssi_intersection_c: faker.number.int({ min: 0, max: 1 }),
  has_sssi_intersection_y: faker.number.int({ min: 0, max: 1 }),
  has_hefer_intersection_y: faker.number.int({ min: 0, max: 1 }),
  has_been_AGRLIV: faker.number.int({ min: 0, max: 1 }),
  ter_closing_date: faker.date.anytime().toUTCString(),
  eligibIntersections: null,
  required_sssi_approval: false,
  ...attributes
})

const createOrganisationPersonSummaryMock = (attributes = {}) => ({
  id: '4309257',
  name: faker.company.name(),
  sbi: parseInt(faker.string.numeric(9)),
  additionalSbiIds: [],
  confirmed: faker.datatype.boolean(),
  lastUpdatedOn: null,
  landConfirmed: null,
  deactivated: faker.datatype.boolean(),
  locked: faker.datatype.boolean(),
  unreadNotificationCount: 3,
  readNotificationCount: 0,
  ...attributes
})

export const organisationByOrgId = orgId => {
  try {
    return getJSON(`./orgId/${orgId}/organisation.json`)
  } catch (error) {
    faker.seed(+orgId)
    return {
      _data: createOrganisationMock({ id: orgId })
    }
  }
}

export const organisationPeopleByOrgId = orgId => {
  try {
    return getJSON(`./orgId/${orgId}/organisation-people.json`)
  } catch (error) {
    faker.seed(+orgId)
    return {
      _data: [...Array(faker.number.int(5))].map(createOrganisationPeopleMock)
    }
  }
}

export const organisationBySbi = sbi => {
  try {
    return getJSON(`./sbi/${sbi}/organisation.json`)
  } catch (error) {
    faker.seed(+sbi)
    return {
      _data: createOrganisationMock({ sbi })
    }
  }
}

export const organisationApplicationsByOrgId = orgId => {
  try {
    return getJSON(`./orgId/${orgId}/organisation-applications.json`)
  } catch (error) {
    faker.seed(+orgId)
    return {
      applications: [...Array(faker.number.int(5))].map(createOrganisationApplicationMock)
    }
  }
}

export const organisationPersonSummary = personId => {
  faker.seed(+personId)
  return createOrganisationPersonSummaryMock({ id: personId })
}
