import {
  transformBusinesDetailsToOrgAdditionalDetailsUpdate,
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

async function insertOrgIdBySbi(sbi, { mongoBusiness, ruralPaymentsBusiness }) {
  const orgId = await ruralPaymentsBusiness.getOrganisationIdBySBI(sbi)
  await mongoBusiness.insertOrgIdBySbi(sbi, orgId)
  return orgId
}

export async function retrieveOrgIdBySbi(sbi, { mongoBusiness, ruralPaymentsBusiness }) {
  return (
    (await mongoBusiness.getOrgIdBySbi(sbi)) ??
    (await insertOrgIdBySbi(sbi, { mongoBusiness, ruralPaymentsBusiness }))
  )
}
