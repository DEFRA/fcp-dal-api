import { retrieveOrgIdBySbi } from './common.js'

export const Query = {
  async business(__, { sbi }, { dataSources }) {
    const organisationId = await retrieveOrgIdBySbi(sbi, dataSources)

    return {
      sbi,
      organisationId,
      land: { sbi }
    }
  }
}
