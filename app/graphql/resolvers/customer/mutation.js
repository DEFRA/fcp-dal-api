import { BadRequest } from '../../../errors/graphql.js'
import { logger } from '../../../logger/logger.js'
import { transformCustomerUpdateInputToPersonUpdate } from '../../../transformers/rural-payments/customer.js'

async function createCustomerResolver(_, { input }, { dataSources, auditTrail }, info) {
  const email = input.email.address
  const { emailDuplicated } = await dataSources.ruralPaymentsCustomer.validateEmail(email)

  if (emailDuplicated) {
    throw new BadRequest('Email address is already in use by another customer', {
      extensions: { code: 'EMAIL_ALREADY_REGISTERED' }
    })
  }

  const transformedPerson = transformCustomerUpdateInputToPersonUpdate({}, input)
  logger.info(`the person transformedPerson is: ${JSON.stringify(transformedPerson, null, 2)}`)

  const person = await dataSources.ruralPaymentsCustomer.createPerson(transformedPerson)
  logger.info(
    `the person created ${person.customerReferenceNumber} is: ${JSON.stringify(person, null, 2)}`
  )
  const personId = `${person.id}`

  auditTrail?.recordAccount(info, 'personId', personId)
  auditTrail?.recordEntity(info, {
    entity: 'person',
    action: 'created',
    entityid: person.customerReferenceNumber
  })

  return {
    success: true,
    customer: { personId: person.id, crn: person.customerReferenceNumber }
  }
}

async function updateCustomerResolver(_, { input }, { dataSources, auditTrail }, info) {
  auditTrail?.recordAccount(info, 'crn', input.crn)
  auditTrail?.recordEntity(info, {
    entity: 'person',
    action: 'updated',
    entityid: input.crn
  })
  const personId = await dataSources.ruralPaymentsCustomer.getPersonIdByCRN(input.crn)
  auditTrail?.recordAccount(info, 'personId', personId)
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
  createCustomer: createCustomerResolver,
  updateCustomerAddress: updateCustomerResolver,
  updateCustomerDateOfBirth: updateCustomerResolver,
  updateCustomerEmail: updateCustomerResolver,
  updateCustomerName: updateCustomerResolver,
  updateCustomerPhone: updateCustomerResolver,
  updateCustomerDoNotContact: updateCustomerResolver,
  updateCustomerAllFields: updateCustomerResolver
}
