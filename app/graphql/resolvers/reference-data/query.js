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
  },
  async businessTypes(__, ___, { dataSources }) {
    const { _data: businessTypes } =
      await dataSources.ruralPaymentsReferenceData.getReferenceData('business-types')
    return businessTypes.map(({ id, type }) => ({ code: id, description: type }))
  },
  async titles(__, ___, { dataSources }) {
    const { _data: titles } =
      await dataSources.ruralPaymentsReferenceData.getReferenceData('titles')
    return titles
  }
}
