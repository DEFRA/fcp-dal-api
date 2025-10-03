import {
  transformBusinesDetailsToOrgAdditionalDetailsUpdate,
  transformBusinessDetailsToOrgDetailsUpdate
} from '../../../transformers/rural-payments/business.js'

export const businessDetailsUpdateResolver = async (__, { input }, { dataSources }) => {
  const organisationId = await dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI(input.sbi)
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
  const organisationId = await dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI(input.sbi)
  const currentOrgDetails =
    await dataSources.ruralPaymentsBusiness.getOrganisationById(organisationId)
  const newOrgAdditionalDetails = transformBusinesDetailsToOrgAdditionalDetailsUpdate(input)
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
