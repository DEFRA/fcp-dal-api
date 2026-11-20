import {
  validateDateInput,
  validateUpstreamTimestamp,
  validateUpstreamTimestampToISO
} from '../../utils/date.js'
import { transformMapping } from '../../utils/mapping.js'
import { booleanise, kitsAddressToDalAddress, transformEntityStatus } from '../common.js'

export function transformBusinessCustomerToCustomerRole(crn, customers) {
  const customer = customers.find(({ customerReference }) => customerReference === crn)

  return customer.role
}

export function transformBusinessCustomerToCustomerPermissionGroups(
  crn,
  customers,
  permissionGroups
) {
  const customer = customers.find(({ customerReference }) => customerReference === crn)

  const customerPrivileges = customer?.privileges?.map((privilege) => privilege.toLowerCase())

  if (!customerPrivileges) {
    return permissionGroups.map(({ id, permissions }) => ({
      id,
      level: permissions[0].level,
      functions: permissions[0].functions
    }))
  }

  return permissionGroups.map(({ id, permissions }) => {
    const customerPermission = permissions.reduce(
      (permission, currentPermission) =>
        currentPermission.privilegeNames.some((privilegeName) =>
          customerPrivileges.includes(privilegeName.toLowerCase())
        )
          ? currentPermission
          : permission,
      permissions[0]
    )
    return { id, level: customerPermission.level, functions: customerPermission.functions }
  })
}

export function transformPersonSummaryToCustomerAuthorisedBusinesses(properties, summary) {
  // Remove any businesses that have no SBI
  const transformed = summary
    .filter(({ sbi }) => sbi !== null)
    .map(({ name, sbi, id }) => ({
      name,
      sbi,
      organisationId: id,
      ...properties
    }))

  return transformed
}

const day = 24 * 60 * 60 * 1000

/**
 * Normalises a date-of-birth timestamp to midnight UTC of the nearest day.
 *
 * Upstream dates of birth may be stored as local midnight (e.g. 23:00 UTC the
 * previous day during BST), so rounding to the nearest whole UTC day avoids
 * the date shifting by one when converted to an ISO date string.
 *
 * @param {number|null|undefined} dateOfBirth - Date of birth as epoch milliseconds.
 * @returns {number|null|undefined} Epoch milliseconds at 00:00:00.000 UTC of the nearest day,
 *   or the original falsy value if `dateOfBirth` is falsy.
 */
const dob2utc = (dateOfBirth) => dateOfBirth && Math.round(dateOfBirth / day) * day

export const ruralPaymentsPortalCustomerTransformer = (data) => {
  return {
    name: {
      title: data.title,
      otherTitle: data.otherTitle,
      first: data.firstName,
      middle: data.middleName,
      last: data.lastName
    },
    dateOfBirth:
      validateUpstreamTimestampToISO(dob2utc(data.dateOfBirth))?.substring(0, 10) ?? null,
    phone: {
      mobile: data.mobile,
      landline: data.landline
    },
    email: {
      address: data.email,
      validated: booleanise(data.emailValidated)
    },
    doNotContact: booleanise(data.doNotContact),
    personalIdentifiers: data.personalIdentifiers,
    address: kitsAddressToDalAddress(data.address),
    status: transformEntityStatus(data)
  }
}

export const transformPersonSearchResult = (data) => ({
  personId: data?.id?.toString(),
  crn: data?.customerReference,
  fullName: data?.fullName,
  address: data?.primaryAddress ? kitsAddressToDalAddress(data.primaryAddress) : null,
  personalIdentifiers: data?.personalIdentifiers,
  nationalInsuranceNumber: data?.nationalInsuranceNumber,
  email: data?.email,
  status: transformEntityStatus(data)
})

// Upstream treats a missing date of birth or phone number as "has none", so send null rather than
// omitting the field, and treat a blank phone number the same as a missing one
const blankToNull = (value) => (value?.trim() ? value : null)

/**
 * Builds the rural payments person duplicate check request from a CustomerDuplicateInput.
 *
 * @param {object} input - The CustomerDuplicateInput.
 * @param {string | number | null} [personId] - Rural payments ID of a person to leave out of the
 * check.
 * @returns {object} The PersonDuplicateRequest body.
 * @throws {BadRequest} When the date of birth is not a valid date.
 */
export const transformCustomerDuplicateInputToPersonDuplicateRequest = (input, personId) => ({
  id: personId ?? null,
  firstName: input.first,
  lastName: input.last,
  dateOfBirth: input.dateOfBirth ? dob2utc(validateDateInput(input.dateOfBirth).getTime()) : null,
  landline: blankToNull(input.phone?.landline),
  mobile: blankToNull(input.phone?.mobile)
})

export const transformPersonDuplicateToCustomerDuplicate = (data) => ({
  crn: data.customerReferenceNumber,
  personId: data.id?.toString(),
  first: data.firstName,
  last: data.lastName,
  dateOfBirth: validateUpstreamTimestampToISO(dob2utc(data.dateOfBirth))?.substring(0, 10) ?? null,
  phone: {
    mobile: data.mobile,
    landline: data.landline
  }
})

export function transformNotificationsToMessages(notifications = []) {
  return notifications.map((message) => ({
    id: message.id,
    subject: message.title,
    date: validateUpstreamTimestampToISO(message.createdAt),
    body: message.body,
    read: !!validateUpstreamTimestamp(message.readAt),
    deleted: !!validateUpstreamTimestamp(message.archivedAt)
  }))
}

export function transformPersonSummaryToCustomerAuthorisedFilteredBusiness(properties, summary) {
  const filteredBusinessForCustomer = summary.find(
    (person) => `${person.sbi}` === `${properties.sbi}`
  )
  if (!filteredBusinessForCustomer) {
    return null
  }

  return {
    organisationId: filteredBusinessForCustomer.id,
    name: filteredBusinessForCustomer.name,
    ...properties
  }
}

const customerUpdateInputMapping = {
  title: (input) => input.title,
  otherTitle: (input) => input.otherTitle,
  firstName: (input) => input.first,
  middleName: (input) => input.middle,
  lastName: (input) => input.last,
  dateOfBirth: (input) => input.dateOfBirth && dob2utc(new Date(input.dateOfBirth).getTime()),
  landline: (input) => input.phone?.landline,
  mobile: (input) => input.phone?.mobile,
  email: (input) => input.email?.address,
  doNotContact: (input) => input.doNotContact,
  address: {
    address1: (input) => input.address?.line1,
    address2: (input) => input.address?.line2,
    address3: (input) => input.address?.line3,
    address4: (input) => input.address?.line4,
    address5: (input) => input.address?.line5,
    pafOrganisationName: (input) => input.address?.pafOrganisationName,
    flatName: (input) => input.address?.flatName,
    buildingNumberRange: (input) => input.address?.buildingNumberRange,
    buildingName: (input) => input.address?.buildingName,
    street: (input) => input.address?.street,
    city: (input) => input.address?.city,
    county: (input) => input.address?.county,
    postalCode: (input) => input.address?.postalCode,
    country: (input) => input.address?.country,
    uprn: (input) => input.address?.uprn,
    dependentLocality: (input) => input.address?.dependentLocality,
    doubleDependentLocality: (input) => input.address?.doubleDependentLocality,
    addressTypeId: (input) => input.address?.addressTypeId
  }
}

export function transformCustomerUpdateInputToPersonUpdate(person, input) {
  const mappedInput = transformMapping(customerUpdateInputMapping, input)

  return {
    ...person,
    ...mappedInput,
    address: {
      ...person.address,
      ...mappedInput.address
    }
  }
}
