import { findCustomerByReferenceHandler } from '../../../core/customer/query.js'

export default {
  Query: {
    customer: function (parent, args, context, info) {
      const { referenceNumber } = args

      return findCustomerByReferenceHandler(referenceNumber)
    }
  }
}
