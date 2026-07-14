export const Query = {
  referenceData() {
    return {}
  }
}

export const ReferenceData = {
  async countriesCurrencies(__, ___, { dataSources }) {
    const { countriesCurrency } = await dataSources.ruralPaymentsReferenceData.getCountryCodes()
    return Object.entries(countriesCurrency).map(([code, currency]) => ({ code, currency }))
  },

  async legalStatuses(__, ___, { dataSources }) {
    const { _data: legalStatuses } =
      await dataSources.ruralPaymentsReferenceData.getReferenceData('legalstatus')
    return legalStatuses.map(({ id, type }) => ({ code: id, description: type }))
  }
}
