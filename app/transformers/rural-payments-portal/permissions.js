export function transformOrganisationAuthorisationToCustomerBusinessPermissionLevel (permissions, authorisation) {
  permissions.reverse()
  const privilegeNames = authorisation.flatMap((personPrivileges) => personPrivileges.privilegeNames)

  for (const permission of permissions) {
    if (privilegeNames.some(privilege => permission.privilegeNames.includes(privilege))) {
      return permission.level
    }
  }

  return null
}
