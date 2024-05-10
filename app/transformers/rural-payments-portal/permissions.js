export function transformOrganisationAuthorisationToCustomerBusinessPermissionLevel (customerId, permissions, authorisation) {
  permissions.reverse()

  const privilegeNames = authorisation.flatMap(personPrivileges =>
    `${personPrivileges.personId}` === `${customerId}` ? personPrivileges.privilegeNames : []
  )

  for (const permission of permissions) {
    if (privilegeNames.some(privilege => permission.privilegeNames.includes(privilege))) {
      return permission.level
    }
  }

  return null
}

export function transformPrivilegesListToBusinessCustomerPermissions (privileges, permissionGroups) {
  return permissionGroups.map(permissionGroup => {
    permissionGroup.permissions.reverse()

    return {
      id: permissionGroup.id,
      name: permissionGroup.name,
      level:
        permissionGroup.permissions.find(({ privilegeNames }) => privilegeNames.some(privilege => privileges.includes(privilege)))?.level ||
        'NO_ACCESS'
    }
  })
}
