export const businessDetailsUpdateResolver = async (__, { input }, { dataSources }) => {
  await dataSources.ruralPaymentsBusiness.updateBusinessBySBI(input.sbi, input)

  return {
    success: true,
    business: {
      sbi: input.sbi
    }
  }
}
