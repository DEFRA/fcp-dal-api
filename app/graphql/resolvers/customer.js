import { findCustomerByReferenceHandler } from '../../core/customer/customer.js'

export default {
  Query: {
    customer: function (parent, args, context) {
      const { referenceNumber } = args

      findCustomerByReferenceHandler(referenceNumber)
    }
  }
}
