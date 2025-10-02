async function insertOrgIdBySbi(sbi, { MongoBusiness, ruralPaymentsBusiness }) {
  const orgId = await ruralPaymentsBusiness.getOrganisationIdBySBI(sbi)
  await MongoBusiness.insertOrgIdBySbi(sbi, orgId)
  return orgId
}

export const Query = {
  async business(__, { sbi }, { dataSources }) {
    const organisationId =
      (await dataSources.mongoBusiness.getOrgIdBySbi(sbi)) ??
      (await insertOrgIdBySbi(sbi, dataSources))

    return {
      sbi,
      organisationId,
      land: { sbi }
    }
  }
}
