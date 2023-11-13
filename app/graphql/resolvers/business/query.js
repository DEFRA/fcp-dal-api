import { Query as LandQuery } from '../land/query.js'

export const Query = {
  business: function (_, { id }) {
    return {
      id: id,
      landManagement: LandQuery.landManagement,
    }
  }
}
