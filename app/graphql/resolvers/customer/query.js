import { findCustomerByReferenceHandler } from '../../core/customer/customer.js'

export default {
  Query: {
    customer: function (parent, args, context, info) {
      const { referenceNumber } = args

      return findCustomerByReferenceHandler(referenceNumber)
    }
  }
}
