import {
  transformBusinesDetailsToOrgAdditionalDetailsUpdate,
  transformBusinessDetailsToOrgDetailsUpdate
} from '../../../transformers/rural-payments/business.js'

export const getOrgId = async (dataSources, sbi, kits) => {
  if (kits.gatewayType === 'external') {
    return kits.extractOrgIdFromDefraIdToken(sbi)
  } else {
    return dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI(sbi)
  }
}

export const businessDetailsUpdateResolver = async (__, { input }, { dataSources, kits }) => {
  const organisationId = await getOrgId(dataSources, input.sbi, kits)
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

export const businessAdditionalDetailsUpdateResolver = async (
  __,
  { input },
  { dataSources, kits }
) => {
  const organisationId = await getOrgId(dataSources, input.sbi, kits)
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
