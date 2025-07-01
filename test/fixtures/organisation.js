import { transformBusinessDetailsToOrgDetails } from '../../app/transformers/rural-payments/business.js'
import files from './files.js'

const { getJSON } = files(import.meta.url)

export const organisationByOrgId = (orgId) => {
  return getJSON(`./orgId/${orgId}/organisation.json`)
}

export const organisationPeopleByOrgId = (orgId) => {
  return getJSON(`./orgId/${orgId}/organisation-people.json`)
}

export const organisationBySbi = (sbi) => {
  return getJSON(`./sbi/${sbi}/organisation-search.json`)
}

export const organisationApplicationsByOrgId = (orgId) => {
  return getJSON(`./orgId/${orgId}/organisation-applications.json`)
}

export const organisationPersonSummary = (attributes = {}) => {
  return getJSON(`./personId/${attributes.id}/organisationSummary.json`)
}

export const businessDetailsUpdatePayload = {
  name: 'HADLEY FARMS LTD',
  reference: '12345678',
  vat: 'GB123456789',
  traderNumber: 'TRADER001',
  vendorNumber: 'VENDOR001',
  address: {
    pafOrganisationName: null,
    line1: 'Bowling Green Cottage',
    line2: 'HAMPSTEAD NORREYS',
    line3: null,
    line4: null,
    line5: null,
    buildingNumberRange: null,
    buildingName: 'COLSHAW HALL',
    flatName: null,
    street: 'SPINNING WHEEL MEAD',
    city: 'BRAINTREE',
    county: null,
    postalCode: 'LL53 8NT',
    country: 'United Kingdom',
    uprn: '10008042952',
    dependentLocality: 'HIGH HAWSKER',
    doubleDependentLocality: null,
    typeId: null
  },
  phone: {
    mobile: '01234042273',
    landline: '01234613020',
    fax: null
  },
  email: {
    address: 'hadleyfarmsltdp@defra.com.test',
    validated: false,
    doNotContact: false
  },
  type: {
    code: 101443,
    type: 'Not Specified'
  },
  correspondenceEmail: {
    address: null
  },
  correspondencePhone: {
    mobile: null,
    landline: null,
    fax: null
  },
  isCorrespondenceAsBusinessAddr: null
}

export const orgDetailsUpdatePayload = transformBusinessDetailsToOrgDetails(
  businessDetailsUpdatePayload
)
