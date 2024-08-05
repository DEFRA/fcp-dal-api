import logger from '../../utils/logger.js'

export const transformOrganisationCustomers = data => {
  const transformed = data.map(({ id, firstName, lastName, customerReference, role, privileges }) => ({
    customerId: id,
    firstName,
    lastName,
    crn: customerReference,
    role,
    privileges
  }))

  logger.debug('Transforming organisation customers', { original: data, transformed })

  return transformed
}

export function transformBusinessCustomerPrivilegesToPermissionGroups (privileges, permissionGroups) {
  const customerPermissionGroups = []

  for (const permissionGroup of permissionGroups) {
    for (const permission of permissionGroup.permissions) {
      if (permission.privilegeNames.some(privilegeName => privileges.includes(privilegeName))) {
        customerPermissionGroups.push({ id: permissionGroup.id, level: permission.level })
      }
    }
  }

  return customerPermissionGroups
}
