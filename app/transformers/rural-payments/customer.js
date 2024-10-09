import { logger } from '../../logger/logger.js'
import { sampleResponse } from '../../logger/utils.js'

export function transformBusinessCustomerToCustomerRole (crn, customers) {
  const customer = customers.find(
    ({ customerReference }) => customerReference === crn
  )

  logger.silly('Transforming business customer to customer role', {
    original: { crn, customers },
    transformed: customer.role
  })
  return customer.role
}

export function transformBusinessCustomerToCustomerPermissionGroups (
  crn,
  customers,
  permissionGroups
) {
  const customer = customers.find(
    ({ customerReference }) => customerReference === crn
  )

  const customerPrivileges = customer?.privileges?.map((privilege) =>
    privilege.toLowerCase()
  )

  if (!customerPrivileges) {
    return permissionGroups.map(({ id, permissions }) => ({
      id,
      level: permissions[0].level
    }))
  }

  return permissionGroups.map(({ id, permissions }) => ({
    id,
    level: permissions.reduce(
      (level, permission) =>
        permission.privilegeNames.some((privilegeName) =>
          customerPrivileges.includes(privilegeName.toLowerCase())
        )
          ? permission.level
          : level,
      permissions[0].level
    )
  }))
}

export function transformPersonSummaryToCustomerAuthorisedBusinesses (
  properties,
  summary
) {
  // Remove any businesses that have no SBI
  const transformed = summary
    .filter(({ sbi }) => sbi !== null)
    .map(({ name, sbi, id }) => ({
      name,
      sbi,
      organisationId: id,
      ...properties
    }))

  logger.silly(
    'Transforming person summary to customer authorised businesses',
    { original: { properties, summary: sampleResponse(summary) }, transformed: sampleResponse(transformed) }
  )
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
    dateOfBirth: data.dateOfBirth,
    phone: {
      mobile: data.mobile,
      landline: data.landline,
      fax: data.fax
    },
    email: {
      address: data.email,
      validated: data.emailValidated,
      doNotContact: data.doNotContact
    },
    address: {
      pafOrganisationName: data.address.pafOrganisationName,
      buildingNumberRange: data.address.buildingNumberRange,
      buildingName: data.address.buildingName,
      flatName: data.address.flatName,
      street: data.address.street,
      city: data.address.city,
      county: data.address.county,
      postalCode: data.address.postalCode,
      country: data.address.country,
      uprn: data.address.uprn,
      dependentLocality: data.address.dependentLocality,
      doubleDependentLocality: data.address.doubleDependentLocality,
      typeId: data.address.addressTypeId
    },
    status: {
      locked: data.locked,
      confirmed: data.confirmed,
      deactivated: data.deactivated
    }
  }
}

export function transformNotificationsToMessages (
  notifications = [],
  showOnlyDeleted = false
) {
  return notifications
    .filter(({ archivedAt }) =>
      showOnlyDeleted ? archivedAt !== null : archivedAt === null
    )
    .map((message) => ({
      id: message.id,
      title: message.title,
      date: message.createdAt,
      body: message.body,
      read: !!message.readAt,
      archivedAt: message.archivedAt
    }))
}

export function transformPersonSummaryToCustomerAuthorisedFilteredBusiness (
  properties,
  summary
) {
  const filteredBusinessForCustomer = summary.find(
    person => `${person.sbi}` === `${properties.sbi}`
  )
  if (!filteredBusinessForCustomer) {
    return null
  }
  logger.silly(
    'Transforming person summary to customer authorised filtered business',
    {
      original: { properties, summary },
      transformed: {
        organisationId: filteredBusinessForCustomer.id,
        name: filteredBusinessForCustomer.name,
        ...properties
      }
    }
  )

  return {
    organisationId: filteredBusinessForCustomer.id,
    name: filteredBusinessForCustomer.name,
    ...properties
  }
}
