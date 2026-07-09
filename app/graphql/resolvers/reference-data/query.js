export const Query = {
  referenceData() {
    return {}
  }
}

export const ReferenceData = {
  async countriesCurrencies(__, ___, { dataSources }) {
    const { countriesCurrency } = await dataSources.ruralPaymentsBusiness.getCountryCodes()
    return Object.entries(countriesCurrency).map(([code, currency]) => ({ code, currency }))
  }
}
