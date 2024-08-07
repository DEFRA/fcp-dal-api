import logger from '../../utils/logger.js'

export function transformBusinessCustomerToCustomerRole (crn, customers) {
  const customer = customers.find(({ customerReference }) => customerReference === crn)

  logger.debug('Transforming business customer to customer role', { original: { crn, customers }, transformed: customer.role })
  return customer.role
}

export function transformBusinessCustomerToCustomerPermissionGroups (crn, customers, permissionGroups) {
  const customer = customers.find(({ customerReference }) => customerReference === crn)

  const customerPermissionGroups = []

  for (const permissionGroup of permissionGroups) {
    for (const permission of permissionGroup.permissions) {
      if (permission.privilegeNames.some(privilegeName => customer.privileges.includes(privilegeName))) {
        customerPermissionGroups.push({ id: permissionGroup.id, level: permission.level })
      }
    }
  }

  return customerPermissionGroups
}

export function transformPersonSummaryToCustomerAuthorisedBusinesses (properties, summary) {
  const transformed = summary.map(({ name, sbi, id }) => ({
    name,
    sbi,
    businessId: id,
    ...properties
  }))

  logger.debug('Transforming person summary to customer authorised businesses', { original: { properties, summary }, transformed })
  return transformed
}
