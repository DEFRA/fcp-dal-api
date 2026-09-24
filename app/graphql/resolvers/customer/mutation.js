import { config } from '../../../config.js'
import { BadRequest, NotFound, Unauthorized } from '../../../errors/graphql.js'
import { logger } from '../../../logger/logger.js'
import { booleanise } from '../../../transformers/common.js'
import { transformCustomerUpdateInputToPersonUpdate } from '../../../transformers/rural-payments/customer.js'

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
  __,
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

  if (!person.email) {
    throw new NotFound('Customer has no email address')
  }

  if (booleanise(person.emailValidated)) {
    throw new BadRequest('Customer email address is already verified', {
      extensions: { code: 'EMAIL_ALREADY_VERIFIED' }
    })
  }

  const { id: digitalContactPartyId } = await dataSources.ruralPaymentsCustomer.confirmEmail(
    person.id,
    person.email
  )

  await dataSources.ruralPaymentsCustomer.saveEmailValidation({
    customerReference: crn,
    partyDigitalContactId: digitalContactPartyId,
    email: person.email,
    linkSentDate: new Date().toISOString()
  })

  await dataSources.ruralPaymentsCustomer.sendVerificationEmail(digitalContactPartyId)

  if (config.get('ruralPayments.customerEmailsDisabled')) {
    const portalUrl = (config.get('ruralPayments.portalUrl') ?? '').replace(/\/+$/, '')
    logger.info(
      `#resolver - sendConfirmEmailAddressEmail - Email verification link: ${portalUrl}/validate-email/${encodeURIComponent(person.email)}/${digitalContactPartyId}`
    )
  }

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
  sendConfirmEmailAddressEmail: sendConfirmEmailAddressEmailResolver
}
