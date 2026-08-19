import { transformCustomerUpdateInputToPersonUpdate } from '../../../transformers/rural-payments/customer.js'

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
      return {
        success: false,
        emailDuplicated: true
      }
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
