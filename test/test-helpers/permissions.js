import { Permissions } from '../../app/data-sources/static/permissions.js'

const permissionGroups = new Permissions().getPermissionGroups()

export const getPermissionFunctionsFromIdAndLevel = ({ id, level }) => ({
  id,
  level,
  functions: permissionGroups
    .find((group) => group.id === id)
    .permissions.find((perm) => perm.level === level).functions
})

export const buildPermissionsFromIdsAndLevels = (tuples) =>
  tuples.map((tuple) => tuple.map(getPermissionFunctionsFromIdAndLevel))
