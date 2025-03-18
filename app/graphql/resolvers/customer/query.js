export const Query = {
  async customer(__, { crn }) {
    return { crn }
  }
}
