import { customerHandler } from '../../core/customer/customer.js'

export default {
  Query: {
    customer: function (parent, args, context) {
      console.log('parent', parent)
      console.log('args', args)
      console.log('context', context)

      customerHandler()
    }
  }
}
