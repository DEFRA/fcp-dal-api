export const Query = {
  async customer (__, { crn }, { authorize }) {
    authorize.checkAuthGroup('ADMIN')
    return { crn }
  }
}
