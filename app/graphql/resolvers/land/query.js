export const Query = {
  land (_, { businessId }) {
    return { sbi: businessId }
  }
}
