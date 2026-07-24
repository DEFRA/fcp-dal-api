import {
  transformBusinessDetailsToOrgAdditionalDetailsUpdate,
  transformBusinessDetailsToOrgDetailsUpdate
} from '../../../transformers/rural-payments/business.js'

export const businessDetailsUpdateResolver = async (__, { input }, { dataSources }) => {
  const organisationId = await retrieveOrgIdBySbi(input.sbi, dataSources)
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

export const businessAdditionalDetailsUpdateResolver = async (__, { input }, { dataSources }) => {
  const organisationId = await retrieveOrgIdBySbi(input.sbi, dataSources)
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

async function upsertOrgIdBySbi(sbi, { mongoBusiness, ruralPaymentsBusiness }) {
  const orgId = await ruralPaymentsBusiness.getOrganisationIdBySBI(sbi)
  await mongoBusiness.upsertOrgIdBySbi(sbi, orgId)
  return orgId
}

export async function retrieveOrgIdBySbi(sbi, { mongoBusiness, ruralPaymentsBusiness }) {
  return (
    (await mongoBusiness.getOrgIdBySbi(sbi)) ??
    upsertOrgIdBySbi(sbi, { mongoBusiness, ruralPaymentsBusiness })
  )
}

// Some fields must always be resolved against the internal gateway using the DAL service
// account, even when the request itself arrived via the external gateway. Resolvers for those
// fields should call this instead of reading dataSources.ruralPaymentsBusiness directly.
export function getRuralPaymentsBusinessDataSource({ gatewayType, dataSources }) {
  if (gatewayType !== 'external') {
    return dataSources.ruralPaymentsBusiness
  }

  if (!dataSources.serviceAccount?.ruralPaymentsBusiness) {
    throw new Error(
      'getRuralPaymentsBusinessDataSource misconfigured: dataSources.serviceAccount.ruralPaymentsBusiness is missing'
    )
  }

  return dataSources.serviceAccount.ruralPaymentsBusiness
}

const validateLockUnlockInput = (input) => {
  if (!input.reason && !input.note) {
    throw new Error('Reason and/or note are required')
  }
}

export const businessLockResolver = async (__, { input }, { dataSources }) => {
  validateLockUnlockInput(input)

  const { sbi, ...lockBodyAttributes } = input

  const organisationId = await dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI(sbi)

  await dataSources.ruralPaymentsBusiness.lockOrganisation(organisationId, lockBodyAttributes)

  return {
    success: true,
    business: {
      sbi: input.sbi
    }
  }
}

export const businessUnlockResolver = async (__, { input }, { dataSources }) => {
  validateLockUnlockInput(input)

  const { sbi, ...unlockBodyAttributes } = input

  const organisationId = await dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI(sbi)

  await dataSources.ruralPaymentsBusiness.unlockOrganisation(organisationId, unlockBodyAttributes)

  return {
    success: true,
    business: {
      sbi: input.sbi
    }
  }
}
