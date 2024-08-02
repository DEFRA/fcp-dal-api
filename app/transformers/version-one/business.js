export const transformOrganisationCustomers = data => {
  return data.map(({ id, firstName, lastName, customerReference, role, privileges }) => ({
    customerId: id,
    firstName,
    lastName,
    crn: customerReference,
    role,
    privileges
  }))
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
