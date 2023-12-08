import { Unauthorized } from '../errors/graphql.js'

const adGroupMapping = {
  ADMIN: process.env.ADMIN_AD_GROUP_ID
}

export class Authorize {
  constructor (args) {
    this.adGroups = args.adGroups
  }

  isAdmin () {
    if (this.adGroups.includes(adGroupMapping.ADMIN)) return true
  }

  checkAuthGroup (groupName) {
    if (!this.isAdmin(this.adGroups) || !this.adGroups.includes(adGroupMapping[groupName])) {
      throw new Unauthorized('Authorization failed, you are not in the correct AD groups')
    }
  }
}
