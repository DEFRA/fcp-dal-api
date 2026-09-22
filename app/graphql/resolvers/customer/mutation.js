import { BadRequest, NotFound } from '../../../errors/graphql.js'
import { transformCustomerUpdateInputToPersonUpdate } from '../../../transformers/rural-payments/customer.js'
import { retrievePersonIdByCRN } from './common.js'

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

async function updateLockCustomerResolver(
  _,
  { input: { crn, reason, note } },
  { dataSources, auditTrail },
  info
) {
  let personId
  try {
    const hasReason = typeof reason === 'string' && reason.trim().length > 0
    const hasNote = typeof note === 'string' && note.trim().length > 0

    if (!hasReason && !hasNote) {
      throw new BadRequest('At least one of reason or note must be provided', {
        extensions: { code: 'REASON_OR_NOTE_REQUIRED' }
      })
    }

    const normalisedReason = hasReason ? reason.trim() : undefined
    const normalisedNote = hasNote ? note.trim() : undefined

    personId = await retrievePersonIdByCRN(crn, dataSources)
    await dataSources.ruralPaymentsCustomer.lockPerson(personId, normalisedReason, normalisedNote)
  } finally {
    auditTrail?.recordAccount(info, 'personId', personId)
    auditTrail?.recordAccount(info, 'crn', crn)
    auditTrail?.recordEntity(info, {
      entity: 'person',
      action: 'locked',
      entityid: personId
    })
  }
}

async function sendConfirmEmailAddressEmailResolver(
  _,
  { input },
  { dataSources, auditTrail },
  info
) {
  auditTrail?.recordAccount(info, 'crn', input.crn)
  const personId = await dataSources.ruralPaymentsCustomer.getPersonIdByCRN(input.crn)
  auditTrail?.recordAccount(info, 'personId', personId)
  const person = await dataSources.ruralPaymentsCustomer.getPersonByPersonId(personId)

  if (!person.email) {
    throw new NotFound('Customer has no email address')
  }

  const { id: digitalContactPartyId } = await dataSources.ruralPaymentsCustomer.confirmEmail(
    personId,
    person.email
  )

  await dataSources.ruralPaymentsCustomer.saveEmailValidation({
    customerReference: input.crn,
    partyDigitalContactId: digitalContactPartyId,
    email: person.email,
    linkSentDate: new Date().toISOString()
  })

  await dataSources.ruralPaymentsCustomer.sendVerificationEmail(digitalContactPartyId)

  auditTrail?.recordEntity(info, {
    entity: 'person',
    action: 'sendConfirmEmailAddressEmail',
    entityid: input.crn
  })

  return {
    success: true
  }
}

export const Mutation = {
  updateCustomerAddress: updateCustomerResolver,
  updateCustomerDateOfBirth: updateCustomerResolver,
  updateCustomerEmail: updateCustomerResolver,
  updateCustomerName: updateCustomerResolver,
  updateCustomerPhone: updateCustomerResolver,
  updateCustomerDoNotContact: updateCustomerResolver,
  updateCustomerAllFields: updateCustomerResolver,
  updateLockCustomer: updateLockCustomerResolver,
  sendConfirmEmailAddressEmail: sendConfirmEmailAddressEmailResolver
}
