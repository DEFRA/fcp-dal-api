import { faker } from '@faker-js/faker/locale/en_GB'

export const organisation = {
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
    city: 'HEATHFIELD',
    county: null,
    postalCode: 'TA2 8LH',
    country: 'United Kingdom',
    uprn: '200001642435',
    dependentLocality: null,
    doubleDependentLocality: null,
    addressTypeId: null
  },
  email: 'lynehouseliveryq@yrevilesuohenyli.com.test',
  emailValidated: false,
  doNotContact: false,
  landline: '01234394643',
  mobile: null,
  fax: null,
  businessType: {
    id: 101443,
    type: 'Not Specified'
  },
  businessReference: '9100974309',
  legalStatus: {
    id: 102111,
    type: 'Sole Proprietorship'
  },
  companiesHouseRegistrationNumber: null,
  charityCommissionRegistrationNumber: null
}

export const organisationCSApplications = {
  applications: [
    {
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
      required_sssi_approval: false
    },
    {
      application_id: faker.number.int({ min: 1649461, max: 9649461 }),
      year: 2023,
      sector_description: faker.string.alphanumeric(),
      module_id: faker.number.int(),
      modcod: null,
      application_type_ds: faker.string.alphanumeric(),
      application_type_de: faker.string.alphanumeric(),
      status_code: 'STADOM',
      status_sub_code: 'AGROFF',
      status_description: 'AGREEMENT OFFER',
      active_application_flag: true,
      application_movement_date: faker.date.anytime().toUTCString(),
      application_code: null,
      workflow_context_sub_code: 'STANDA',
      needs_intervention: false,
      show_accept: false,
      submit_date: faker.date.anytime().toUTCString(),
      status: 'Checking Application',
      common_lands_flag: false,
      prints_count: faker.number.int({ min: 0, max: 20 }),
      queued: false,
      has_sssi_intersection_c: faker.number.int({ min: 0, max: 1 }),
      has_sssi_intersection_y: faker.number.int({ min: 0, max: 1 }),
      has_hefer_intersection_y: faker.number.int({ min: 0, max: 1 }),
      has_been_AGRLIV: faker.number.int({ min: 0, max: 1 }),
      ter_closing_date: faker.date.anytime().toUTCString(),
      eligibIntersections: null,
      required_sssi_approval: false
    }
  ]
}

export const organisations = [organisation]
