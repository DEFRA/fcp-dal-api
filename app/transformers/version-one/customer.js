export function transformBusinessCustomerToCustomerRole (crn, customers) {
  const customer = customers.find(({ customerReference }) => customerReference === crn)
  return customer.role
}

export function transformBusinessCustomerToCustomerPrivileges (crn, customers) {
  const customer = customers.find(({ customerReference }) => customerReference === crn)
  return customer.privileges
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
  return summary.map(({ name, sbi, id }) => ({
    name,
    sbi,
    businessId: id,
    ...properties
  }))
}
