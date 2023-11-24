export const Query = {
  business (_, { id }) {
    return {
      id,
      land: { sbi: id }
    }
  }
}
