import { GraphQLError } from 'graphql'
import { BadRequest } from '../../../errors/graphql.js'
import {
  transformBusinessDetailsToOrgAdditionalDetailsUpdate,
  transformBusinessDetailsToOrgDetailsUpdate
} from '../../../transformers/rural-payments/business.js'

/**
 * @import {
 *   GraphQLResolveInfo,
 *   MutationUpdateBusinessAddressArgs,
 *   MutationUpdateBusinessAllFieldsArgs,
 *   MutationUpdateBusinessDateStartedFarmingArgs,
 *   MutationUpdateBusinessDeactivateArgs,
 *   MutationUpdateBusinessEmailArgs,
 *   MutationUpdateBusinessLegalStatusArgs,
 *   MutationUpdateBusinessLockArgs,
 *   MutationUpdateBusinessNameArgs,
 *   MutationUpdateBusinessPhoneArgs,
 *   MutationUpdateBusinessReactivateArgs,
 *   MutationUpdateBusinessRegistrationNumbersArgs,
 *   MutationUpdateBusinessTypeArgs,
 *   MutationUpdateBusinessUnlockArgs,
 *   MutationUpdateBusinessVATArgs,
 *   ResolverContext
 * } from '../types.js'
 */

/**
 * GraphQL cannot express "at least one of" on an input type, so check that a phone has a number
 * @param {{ mobile?: string | null, landline?: string | null }} phone the phone from the input
 * @returns {void}
 * @throws {BadRequest} if neither a mobile nor a landline number is given
 */
export const validatePhoneHasNumber = (phone) => {
  if (!phone?.mobile?.trim() && !phone?.landline?.trim()) {
    throw new BadRequest('phone must include at least one of mobile or landline', {
      extensions: { code: 'BAD_USER_INPUT' }
    })
  }
}

/**
 * Resolves the `updateBusinessName`, `updateBusinessPhone`, `updateBusinessEmail`,
 * `updateBusinessAddress` and `updateBusinessVAT` mutations
 *
 * @param {unknown} __
 * @param {
 *   | MutationUpdateBusinessNameArgs
 *   | MutationUpdateBusinessPhoneArgs
 *   | MutationUpdateBusinessEmailArgs
 *   | MutationUpdateBusinessAddressArgs
 *   | MutationUpdateBusinessVATArgs
 * } args
 * @param {ResolverContext} context
 * @param {GraphQLResolveInfo} info
 */
export const businessDetailsUpdateResolver = async (
  __,
  { input },
  { dataSources, auditTrail, defraIdContext },
  info
) => {
  auditTrail?.recordAccount(info, 'sbi', input.sbi)
  auditTrail?.recordEntity(info, {
    entity: 'business',
    action: 'updated',
    entityid: input.sbi
  })
  const organisationId = await retrieveOrgIdBySbi(input.sbi, { dataSources, defraIdContext })

  auditTrail?.recordAccount(info, 'organisationId', organisationId)

  const currentOrgDetails =
    await dataSources.ruralPaymentsBusiness.getOrganisationById(organisationId)
  const newOrgDetails = transformBusinessDetailsToOrgDetailsUpdate(input)
  const orgDetails = { ...currentOrgDetails, ...newOrgDetails }
  await dataSources.ruralPaymentsBusiness.updateOrganisationDetails(organisationId, orgDetails)

  return {
    success: true,
    business: {
      sbi: input.sbi
    }
  }
}

/**
 * Resolves the `updateBusinessLegalStatus`, `updateBusinessType`,
 * `updateBusinessDateStartedFarming` and `updateBusinessRegistrationNumbers` mutations
 *
 * @param {unknown} __
 * @param {
 *   | MutationUpdateBusinessLegalStatusArgs
 *   | MutationUpdateBusinessTypeArgs
 *   | MutationUpdateBusinessDateStartedFarmingArgs
 *   | MutationUpdateBusinessRegistrationNumbersArgs
 * } args
 * @param {ResolverContext} context
 * @param {GraphQLResolveInfo} info
 */
export const businessAdditionalDetailsUpdateResolver = async (
  __,
  { input },
  { dataSources, auditTrail, defraIdContext },
  info
) => {
  auditTrail?.recordAccount(info, 'sbi', input.sbi)
  auditTrail?.recordEntity(info, {
    entity: 'business',
    action: 'updated',
    entityid: input.sbi
  })
  const organisationId = await retrieveOrgIdBySbi(input.sbi, { dataSources, defraIdContext })

  auditTrail?.recordAccount(info, 'organisationId', organisationId)

  const currentOrgDetails =
    await dataSources.ruralPaymentsBusiness.getOrganisationById(organisationId)
  const newOrgAdditionalDetails = transformBusinessDetailsToOrgAdditionalDetailsUpdate(input)
  const orgAdditionalDetails = { ...currentOrgDetails, ...newOrgAdditionalDetails }
  await dataSources.ruralPaymentsBusiness.updateOrganisationAdditionalDetails(
    organisationId,
    orgAdditionalDetails
  )

  return {
    success: true,
    business: {
      sbi: input.sbi
    }
  }
}

// Returns null when there is nothing to update, so consumers can distinguish "updated" from
// "not attempted". Upstream failures propagate as standard GraphQL errors.
const updateIfRequired = async (newDetails, update) => {
  if (!Object.keys(newDetails).length) {
    return null
  }
  await update()
  return true
}

// A failed update nulls the whole mutation payload, so the applied/not-applied state of each
// update travels on the error's extensions instead: true = applied, false = attempted and
// failed, null = not attempted.
const withUpdateStatuses = (error, statuses) => {
  if (error instanceof GraphQLError) {
    Object.assign(error.extensions, statuses)
    return error
  }
  return new GraphQLError(error.message, { originalError: error, extensions: statuses })
}

/**
 * Resolves the `updateBusinessAllFields` mutation
 *
 * @param {unknown} __
 * @param {MutationUpdateBusinessAllFieldsArgs} args
 * @param {ResolverContext} context
 * @param {GraphQLResolveInfo} info
 */
export const businessAllFieldsUpdateResolver = async (
  __,
  { input },
  { dataSources, auditTrail, defraIdContext },
  info
) => {
  auditTrail?.recordAccount(info, 'sbi', input.sbi)
  auditTrail?.recordEntity(info, {
    entity: 'business',
    action: 'updated',
    entityid: input.sbi
  })
  const organisationId = await retrieveOrgIdBySbi(input.sbi, { dataSources, defraIdContext })

  auditTrail?.recordAccount(info, 'organisationId', organisationId)

  const currentOrgDetails =
    await dataSources.ruralPaymentsBusiness.getOrganisationById(organisationId)

  const newOrgDetails = transformBusinessDetailsToOrgDetailsUpdate(input)
  const newOrgAdditionalDetails = transformBusinessDetailsToOrgAdditionalDetailsUpdate(input)

  const updatedOrgDetails = {
    ...currentOrgDetails,
    ...newOrgDetails,
    ...newOrgAdditionalDetails
  }

  let businessDetailsUpdated = null
  try {
    businessDetailsUpdated = await updateIfRequired(newOrgDetails, () =>
      dataSources.ruralPaymentsBusiness.updateOrganisationDetails(organisationId, updatedOrgDetails)
    )
  } catch (error) {
    throw withUpdateStatuses(error, {
      businessDetailsUpdated: false,
      additionalBusinessDetailsUpdated: null
    })
  }

  let additionalBusinessDetailsUpdated = null
  try {
    additionalBusinessDetailsUpdated = await updateIfRequired(newOrgAdditionalDetails, () =>
      dataSources.ruralPaymentsBusiness.updateOrganisationAdditionalDetails(
        organisationId,
        updatedOrgDetails
      )
    )
  } catch (error) {
    throw withUpdateStatuses(error, {
      businessDetailsUpdated,
      additionalBusinessDetailsUpdated: false
    })
  }

  return {
    success: true,
    businessDetailsUpdated,
    additionalBusinessDetailsUpdated,
    business: {
      sbi: input.sbi
    }
  }
}

async function upsertOrgIdBySbi(sbi, { mongoBusiness, ruralPaymentsBusiness }) {
  const orgId = await ruralPaymentsBusiness.getOrganisationIdBySBI(sbi)
  await mongoBusiness.upsertOrgIdBySbi(sbi, orgId)
  return orgId
}

/**
 * Look up the Rural Payments organisation id for a business
 * @param {string} sbi Single Business Identifier: a unique 9-digit number
 * @param {Pick<ResolverContext, 'dataSources' | 'defraIdContext'>} context
 * @returns the organisation id
 */
export async function retrieveOrgIdBySbi(sbi, { dataSources, defraIdContext }) {
  if (defraIdContext) {
    // A defraIdContext is only built for externally authenticated requests, in which case the org
    // id can be retrieved directly from the token
    return defraIdContext.orgId(sbi)
  }

  const { mongoBusiness, ruralPaymentsBusiness } = dataSources
  return (
    (await mongoBusiness.getOrgIdBySbi(sbi)) ??
    upsertOrgIdBySbi(sbi, { mongoBusiness, ruralPaymentsBusiness })
  )
}

// Some fields must always be resolved against the internal gateway even when the request itself
// arrived with external authorisation. Resolvers for those fields should call this instead of using
// dataSources.ruralPaymentsBusiness directly.
/**
 * @param {Pick<ResolverContext, 'dataSources'> & { useServiceAccountForExternal?: boolean }} ctx
 *   the resolver context, plus whether to use the service account for external requests
 */
export function getRuralPaymentsBusinessDataSource({
  dataSources,
  useServiceAccountForExternal = false
}) {
  if (dataSources.serviceAccount.ruralPaymentsBusiness && useServiceAccountForExternal) {
    // This is an externally routed request (service account datasource is only configured for
    // external routes) and the resolver has explicitly asked for the service account
    return dataSources.serviceAccount.ruralPaymentsBusiness
  }
  return dataSources.ruralPaymentsBusiness
}

const validateLockUnlockInput = (input) => {
  if (!input.reason && !input.note) {
    throw new BadRequest('Reason and/or note are required')
  }
}

/**
 * Resolves the `updateBusinessLock` mutation
 *
 * @param {unknown} __
 * @param {MutationUpdateBusinessLockArgs} args
 * @param {ResolverContext} context
 * @param {GraphQLResolveInfo} info
 */
export const businessLockResolver = async (__, { input }, { dataSources, auditTrail }, info) => {
  const { sbi, ...lockBodyAttributes } = input
  auditTrail?.recordAccount(info, 'sbi', sbi)
  auditTrail?.recordEntity(info, {
    entity: 'business',
    action: 'locked',
    entityid: sbi
  })

  const organisationId = await dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI(sbi)

  auditTrail?.recordAccount(info, 'organisationId', organisationId)

  validateLockUnlockInput(input)

  await dataSources.ruralPaymentsBusiness.lockOrganisation(organisationId, lockBodyAttributes)

  return {
    success: true,
    business: {
      sbi: input.sbi
    }
  }
}

/**
 * Resolves the `updateBusinessUnlock` mutation
 *
 * @param {unknown} __
 * @param {MutationUpdateBusinessUnlockArgs} args
 * @param {ResolverContext} context
 * @param {GraphQLResolveInfo} info
 */
export const businessUnlockResolver = async (__, { input }, { dataSources, auditTrail }, info) => {
  const { sbi, ...unlockBodyAttributes } = input
  auditTrail?.recordAccount(info, 'sbi', sbi)
  auditTrail?.recordEntity(info, {
    entity: 'business',
    action: 'unlocked',
    entityid: sbi
  })

  const organisationId = await dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI(sbi)

  auditTrail?.recordAccount(info, 'organisationId', organisationId)

  validateLockUnlockInput(input)

  await dataSources.ruralPaymentsBusiness.unlockOrganisation(organisationId, unlockBodyAttributes)

  return {
    success: true,
    business: {
      sbi: input.sbi
    }
  }
}

/**
 * Resolves the `updateBusinessReactivate` mutation
 *
 * @param {unknown} __
 * @param {MutationUpdateBusinessReactivateArgs} args
 * @param {ResolverContext} context
 * @param {GraphQLResolveInfo} info
 */
export const businessReactivateResolver = async (
  __,
  { input },
  { dataSources, auditTrail },
  info
) => {
  const { sbi, ...reactivateBodyAttributes } = input
  auditTrail?.recordAccount(info, 'sbi', sbi)
  auditTrail?.recordEntity(info, {
    entity: 'business',
    action: 'reactivated',
    entityid: sbi
  })

  const organisationId = await dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI(sbi)

  auditTrail?.recordAccount(info, 'organisationId', organisationId)

  validateLockUnlockInput(input)

  await dataSources.ruralPaymentsBusiness.reactivateOrganisation(
    organisationId,
    reactivateBodyAttributes
  )

  return {
    success: true,
    business: {
      sbi: input.sbi
    }
  }
}

/**
 * Resolves the `updateBusinessDeactivate` mutation
 *
 * @param {unknown} __
 * @param {MutationUpdateBusinessDeactivateArgs} args
 * @param {ResolverContext} context
 * @param {GraphQLResolveInfo} info
 */
export const businessDeactivateResolver = async (
  __,
  { input },
  { dataSources, auditTrail },
  info
) => {
  const { sbi, ...reactivateBodyAttributes } = input
  auditTrail?.recordAccount(info, 'sbi', sbi)
  auditTrail?.recordEntity(info, {
    entity: 'business',
    action: 'deactivate',
    entityid: sbi
  })

  const organisationId = await dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI(sbi)

  auditTrail?.recordAccount(info, 'organisationId', organisationId)

  validateLockUnlockInput(input)

  await dataSources.ruralPaymentsBusiness.deactivateOrganisation(
    organisationId,
    reactivateBodyAttributes
  )

  return {
    success: true,
    business: {
      sbi: input.sbi
    }
  }
}
