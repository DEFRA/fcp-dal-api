import { logger } from '../../utils/logger.js'

export function transformBusinessCustomerToCustomerRole (crn, customers) {
  const customer = customers.find(
    ({ customerReference }) => customerReference === crn
  )

  logger.debug('Transforming business customer to customer role', {
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

  const customerPermissionGroups = []

  for (const permissionGroup of permissionGroups) {
    for (const permission of permissionGroup.permissions) {
      if (
        permission.privilegeNames.some(privilegeName =>
          customer.privileges.includes(privilegeName)
        )
      ) {
        customerPermissionGroups.push({
          id: permissionGroup.id,
          level: permission.level
        })
      }
    }
  }

  return customerPermissionGroups
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

  logger.debug(
    'Transforming person summary to customer authorised businesses',
    { original: { properties, summary }, transformed }
  )
  return transformed
}

export const ruralPaymentsPortalCustomerTransformer = data => {
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
    .map(message => ({
      id: message.id,
      title: message.title,
      date: message.createdAt,
      body: message.body,
      read: !!message.readAt,
      archivedAt: message.archivedAt
    }))
}

export function transformPersonSummaryToCustomerAuthorisedFilteredBusiness (
  sbi,
  summary
) {
  const filteredBusinessForCustomer = summary.find(
    person => `${person.sbi}` === `${sbi}`
  )
  if (!filteredBusinessForCustomer) {
    return null
  }

  return {
    organisationId: filteredBusinessForCustomer.id,
    name: filteredBusinessForCustomer.name,
    sbi
  }
}
