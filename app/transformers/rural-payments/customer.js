import { validateDate } from '../../utils/date.js'
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
    dateOfBirth: data.dateOfBirth,
    phone: {
      mobile: data.mobile,
      landline: data.landline
    },
    email: {
      address: data.email,
      validated: data.emailValidated
    },
    doNotContact: data.doNotContact,
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
