import { findCustomerByReferenceHandler } from '../../../core/customer/query.js'
import { updateCustomerAuthenticateHandler } from '../../../core/customer/mutation.js'

export const Query = {
  customer (_, { referenceNumber }) {
    return findCustomerByReferenceHandler(referenceNumber)
  }
}

export const Mutation = {
  customerAuthenticateUpdate (_, { customerAuthenticateUpdate }) {
    return updateCustomerAuthenticateHandler(customerAuthenticateUpdate)
  }
}
