import { retrievePersonIdByCRN } from './common.js'

export const Query = {
  async customer(__, { crn }, { dataSources }) {
    const personId = await retrievePersonIdByCRN(crn, dataSources)

    return { crn, personId }
  }
}
