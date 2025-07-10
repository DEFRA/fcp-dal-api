import { businessDetailsUpdateResolver } from './common.js'
import { Query } from './query.js'

export const Mutation = {
  updateBusinessName: businessDetailsUpdateResolver,
  updateBusinessPhone: businessDetailsUpdateResolver,
  updateBusinessEmail: businessDetailsUpdateResolver,
  updateBusinessAddress: businessDetailsUpdateResolver
}

export const UpdateBusinessResponse = {
  business({ business: { sbi } }, _, context) {
    return Query.business({}, { sbi }, context)
  }
}
