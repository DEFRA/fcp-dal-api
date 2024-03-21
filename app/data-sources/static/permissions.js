import { createRequire } from 'node:module'

const permissionGroups = createRequire(import.meta.url)('./permission-groups.json')

export class Permissions {
  getPermissionGroups () {
    return permissionGroups
  }
}
