import { config } from '../../../config.js'
import { BadRequest, Forbidden, Unauthorized } from '../../../errors/graphql.js'
import { logger } from '../../../logger/logger.js'
import { booleanise } from '../../../transformers/common.js'
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

// Only available to external users (see the @auth userType restriction), so the customer is always
// the one identified by the CRN in the request's Defra ID token.
async function sendConfirmEmailAddressEmailResolver(
  _,
  { input },
  { dataSources, auditTrail, defraIdContext },
  info
) {
  if (!defraIdContext) {
    throw new Unauthorized('A Defra ID token is required to send a confirm email address email')
  }
  const crn = defraIdContext.crn()
  auditTrail?.recordAccount(info, 'crn', crn)
  auditTrail?.recordEntity(info, {
    entity: 'person',
    action: 'verification-email-sent',
    entityid: crn
  })
  const person = await dataSources.ruralPaymentsCustomer.getExternalPerson()
  auditTrail?.recordAccount(info, 'personId', person.id)

  // An email address is required even when a new one is given, as confirmEmail 404s without one
  if (!person.email) {
    throw new BadRequest('Customer has no email address', {
      extensions: { code: 'CUSTOMER_MISSING_EMAIL' }
    })
  }

  // When an email is given, it replaces the customer's current email address once validated
  const emailToConfirm = input?.email ?? person.email

  const isCurrentEmail = emailToConfirm.toLowerCase() === person.email.toLowerCase()
  if (isCurrentEmail && booleanise(person.emailValidated)) {
    throw new BadRequest('Customer email address is already verified', {
      extensions: { code: 'EMAIL_ALREADY_VERIFIED' }
    })
  }

  const { id: digitalContactPartyId } = await dataSources.ruralPaymentsCustomer.confirmEmail(
    person.id,
    emailToConfirm
  )

  await dataSources.ruralPaymentsCustomer.saveEmailValidation({
    customerReference: crn,
    partyDigitalContactId: digitalContactPartyId,
    email: emailToConfirm,
    linkSentDate: new Date().toISOString()
  })

  await dataSources.ruralPaymentsCustomer.sendVerificationEmail(digitalContactPartyId)

  if (config.get('ruralPayments.customerEmailsDisabled')) {
    const portalUrl = config.get('ruralPayments.portalUrl')
    logger.info(
      `#resolver - sendConfirmEmailAddressEmail - Email verification link: ${portalUrl}/validate-email/${encodeURIComponent(emailToConfirm)}/${digitalContactPartyId}`
    )
  }

  return {
    success: true
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
    const { reason: trimmedReason, note: trimmedNote } = validateReasonOrNote(reason, note)

    personId = await retrievePersonIdByCRN(crn, dataSources)
    await dataSources.ruralPaymentsCustomer.lockPerson(personId, trimmedReason, trimmedNote)
  } finally {
    auditTrail?.recordAccount(info, 'personId', personId)
    auditTrail?.recordAccount(info, 'crn', crn)
    auditTrail?.recordEntity(info, {
      entity: 'person',
      action: 'locked',
      entityid: crn
    })
  }

  return {
    success: true,
    customer: { personId }
  }
}

async function updateUnlockCustomerResolver(
  _,
  { input: { crn, reason, note } },
  { dataSources, auditTrail },
  info
) {
  let personId
  try {
    const { reason: trimmedReason, note: trimmedNote } = validateReasonOrNote(reason, note)

    personId = await retrievePersonIdByCRN(crn, dataSources)
    await dataSources.ruralPaymentsCustomer.unlockPerson(personId, trimmedReason, trimmedNote)
  } finally {
    auditTrail?.recordAccount(info, 'personId', personId)
    auditTrail?.recordAccount(info, 'crn', crn)
    auditTrail?.recordEntity(info, {
      entity: 'person',
      action: 'unlocked',
      entityid: crn
    })
  }

  return {
    success: true,
    customer: { personId }
  }
}

async function updateDeactivateCustomerResolver(
  _,
  { input: { crn, reason, note } },
  { dataSources, auditTrail },
  info
) {
  auditTrail?.recordAccount(info, 'crn', crn)
  auditTrail?.recordEntity(info, { entity: 'person', action: 'deactivated', entityid: crn })

  const { reason: trimmedReason, note: trimmedNote } = validateReasonOrNote(reason, note)

  const personId = await retrievePersonIdByCRN(crn, dataSources)
  auditTrail?.recordAccount(info, 'personId', personId)

  await dataSources.ruralPaymentsCustomer.deactivatePerson(personId, trimmedReason, trimmedNote)

  return {
    success: true,
    customer: { personId }
  }
}

async function updateCustomerAuthenticationQuestionsResolver(
  _,
  { input: { crn, memorableDate, memorableEvent, memorableLocation } },
  { dataSources, auditTrail, defraIdContext },
  info
) {
  auditTrail?.recordAccount(info, 'crn', crn)
  auditTrail?.recordEntity(info, {
    entity: 'authenticate-question',
    action: 'updated',
    entityid: crn
  })

  // A defraIdContext is only built for external users, who may only update their own answers
  if (defraIdContext && defraIdContext.crn() !== crn) {
    throw new Forbidden('Defra ID token is not valid for the provided CRN')
  }

  const personId = await retrievePersonIdByCRN(crn, dataSources)
  auditTrail?.recordAccount(info, 'personId', personId)

  await dataSources.ruralPaymentsCustomer.saveAuthenticateAnswersByCRN(crn, {
    memorableDate,
    memorableEvent,
    memorableLocation
  })

  return {
    success: true,
    customer: { crn, personId }
  }
}

function validateReasonOrNote(reason, note) {
  const hasReason = typeof reason === 'string' && reason.trim().length > 0
  const hasNote = typeof note === 'string' && note.trim().length > 0

  if (!hasReason && !hasNote) {
    throw new BadRequest('At least one of reason or note must be provided', {
      extensions: { code: 'REASON_OR_NOTE_REQUIRED' }
    })
  }

  return { reason: hasReason ? reason.trim() : undefined, note: hasNote ? note.trim() : undefined }
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
  updateUnlockCustomer: updateUnlockCustomerResolver,
  sendConfirmEmailAddressEmail: sendConfirmEmailAddressEmailResolver,
  updateDeactivateCustomer: updateDeactivateCustomerResolver,
  updateCustomerAuthenticationQuestions: updateCustomerAuthenticationQuestionsResolver
}
