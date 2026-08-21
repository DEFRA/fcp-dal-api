import { transformCustomerUpdateInputToPersonUpdate } from '../../../transformers/rural-payments/customer.js'
import { BadRequest } from '../../../errors/graphql.js'

async function updateCustomerResolver(_, { input }, { dataSources }) {
  const personId = await dataSources.ruralPaymentsCustomer.getPersonIdByCRN(input.crn)

  const person = await dataSources.ruralPaymentsCustomer.getPersonByPersonId(personId)

  const isEmailChanging =
    input.email && input.email.address?.toLowerCase() !== person.email?.toLowerCase()

  if (isEmailChanging) {
    const { emailDuplicated } = await dataSources.ruralPaymentsCustomer.validateEmail(
      input.email.address
    )
    if (emailDuplicated) {
      throw new BadRequest('Email address is already in use by another customer', {
        extensions: { code: 'EMAIL_ALREADY_REGISTERED' }
      })
    }
  }

  await dataSources.ruralPaymentsCustomer.updatePersonDetails(
    personId,
    transformCustomerUpdateInputToPersonUpdate(person, input)
  )

  return {
    success: true,
    customer: { personId }
  }
}

export const Mutation = {
  updateCustomerAddress: updateCustomerResolver,
  updateCustomerDateOfBirth: updateCustomerResolver,
  updateCustomerEmail: updateCustomerResolver,
  updateCustomerName: updateCustomerResolver,
  updateCustomerPhone: updateCustomerResolver,
  updateCustomerDoNotContact: updateCustomerResolver,
  updateCustomerAllFields: updateCustomerResolver
}
