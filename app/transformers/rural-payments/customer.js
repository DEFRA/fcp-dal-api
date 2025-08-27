import { validateDate } from '../../utils/date.js'
import { transformMapping } from '../../utils/mapping.js'
import { kitsAddressToDalAddress, transformEntityStatus } from '../common.js'

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

export const ruralPaymentsPortalCustomerTransformer = (data) => {
  return {
    name: {
      title: data.title,
      otherTitle: data.otherTitle,
      first: data.firstName,
      middle: data.middleName,
      last: data.lastName
    },
    dateOfBirth: new Date(data.dateOfBirth).toISOString().substring(0, 10),
    phone: {
      mobile: data.mobile,
      landline: data.landline
    },
    email: {
      address: data.email,
      validated: data.emailValidated
    },
    doNotContact: data.doNotContact,
    personalIdentifiers: data.personalIdentifiers,
    address: kitsAddressToDalAddress(data.address),
    status: transformEntityStatus(data)
  }
}

export function transformNotificationsToMessages(notifications = []) {
  return notifications.map((message) => ({
    id: message.id,
    subject: message.title,
    date: validateDate(message.createdAt).toISOString(),
    body: message.body,
    read: !!message.readAt,
    deleted: !!message.archivedAt
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
  dateOfBirth: (input) =>
    input.dateOfBirth ? new Date(input.dateOfBirth).getTime() : input.dateOfBirth,
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
