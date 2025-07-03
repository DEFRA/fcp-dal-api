import { transformBusinessDetailsToOrgDetailsUpdate } from '../../app/transformers/rural-payments/business.js'
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
  name: 'HADLEY FARMS LTD 2',
  address: {
    pafOrganisationName: 'pafOrganisationName',
    line1: 'line1',
    line2: 'line2',
    line3: 'line3',
    line4: 'line4',
    line5: 'line5',
    buildingNumberRange: 'buildingNumberRange',
    buildingName: 'COLSHAW HALL',
    flatName: null,
    street: 'street',
    city: 'BRAINTREE',
    county: null,
    postalCode: '12312312',
    country: 'United Kingdom',
    uprn: '123123123',
    dependentLocality: 'HIGH HAWSKER',
    doubleDependentLocality: null
  },
  correspondenceAddress: {
    pafOrganisationName: 'c pafOrganisationName',
    line1: 'c line1',
    line2: 'c line2',
    line3: 'c line3',
    line4: 'c line4',
    line5: 'c line5',
    buildingNumberRange: 'buildingNumberRange',
    buildingName: 'buildingName',
    flatName: 'flatName',
    street: 'street',
    city: 'city',
    county: 'county',
    postalCode: '1231231',
    country: 'USA',
    uprn: '10008042952',
    dependentLocality: 'HIGH HAWSKER',
    doubleDependentLocality: 'doubleDependentLocality'
  },
  phone: {
    mobile: '01234042273',
    landline: '01234613020'
  },
  email: {
    address: 'hadleyfarmsltdp@defra.com.test'
  },
  correspondenceEmail: {
    address: 'hadleyfarmsltdp@defra.com.123'
  },
  correspondencePhone: {
    mobile: '07111222333',
    landline: '01225111222'
  },
  isCorrespondenceAsBusinessAddr: false
}

export const orgDetailsUpdatePayload = transformBusinessDetailsToOrgDetailsUpdate(
  businessDetailsUpdatePayload
)
