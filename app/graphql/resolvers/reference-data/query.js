export const Query = {
  referenceData() {
    return {}
  }
}

export const ReferenceData = {
  async countriesCurrencies(__, ___, { dataSources }) {
    const { countriesCurrency } = await dataSources.ruralPaymentsReferenceData.getCountryCodes()
    return Object.entries(countriesCurrency).map(([code, currency]) => ({ code, currency }))
  }
}
