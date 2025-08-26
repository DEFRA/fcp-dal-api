import { transformCustomerUpdateInputToPersonUpdate } from '../../../transformers/rural-payments/customer.js'

async function updateCustomerResolver(_, { input }, { dataSources }) {
  const personId = await dataSources.ruralPaymentsCustomer.getPersonIdByCRN(input.crn)

  const person = await dataSources.ruralPaymentsCustomer.getPersonByPersonId(personId)

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
  updateCustomerDoNotContact: updateCustomerResolver
}
