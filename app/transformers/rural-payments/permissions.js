export function transformOrganisationAuthorisationToCustomerBusinessPermissionLevel(
  personId,
  permissions,
  orgCustomers
) {
  permissions.reverse()

  const privilegeNames = orgCustomers.flatMap((personPrivileges) =>
    `${personPrivileges.id}` === `${personId}` ? personPrivileges.privileges : []
  )

  for (const permission of permissions) {
    const hasPrivilegeName = privilegeNames.some((privilege) =>
      permission.privilegeNames.includes(privilege)
    )
    if (hasPrivilegeName) {
      return permission.level
    }
  }

  return null
}
