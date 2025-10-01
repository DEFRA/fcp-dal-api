async function insertOrgIdBySbi(sbi, { mongoBusinesses, ruralPaymentsBusiness }) {
  const orgId = await ruralPaymentsBusiness.getOrganisationIdBySBI(sbi)
  await mongoBusinesses.insertOrgIdBySbi(sbi, orgId)
  return orgId
}

export const Query = {
  async business(__, { sbi }, { dataSources }) {
    const organisationId =
      (await dataSources.mongoBusinesses.getOrgIdBySbi(sbi)) ??
      (await insertOrgIdBySbi(sbi, dataSources))

    return {
      sbi,
      organisationId,
      land: { sbi }
    }
  }
}
