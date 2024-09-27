import { createRequire } from 'node:module'

const permissionGroups = createRequire(import.meta.url)('./permission-groups.json')

export class Permissions {
  logger = null

  constructor (config) {
    this.logger = config.logger
  }

  getPermissionGroups () {
    return permissionGroups
  }
}
