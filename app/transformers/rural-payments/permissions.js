export function transformOrganisationAuthorisationToCustomerBusinessPermissionLevel (
  customerId,
  permissions,
  authorisation
) {
  permissions.reverse()

  const privilegeNames = authorisation.flatMap(personPrivileges =>
    `${personPrivileges.id}` === `${customerId}`
      ? personPrivileges.privileges
      : []
  )

  for (const permission of permissions) {
    const hasPrivilegeName = privilegeNames.some(privilege =>
      permission.privilegeNames.includes(privilege)
    )
    if (hasPrivilegeName) {
      return permission.level
    }
  }

  return null
}

export function transformPrivilegesListToBusinessCustomerPermissions (
  privileges,
  permissionGroups
) {
  return permissionGroups.map(permissionGroup => {
    permissionGroup.permissions.reverse()

    return {
      id: permissionGroup.id,
      name: permissionGroup.name,
      level:
        permissionGroup.permissions.find(({ privilegeNames }) =>
          privilegeNames.some(privilege => privileges.includes(privilege))
        )?.level || 'NO_ACCESS'
    }
  })
}
