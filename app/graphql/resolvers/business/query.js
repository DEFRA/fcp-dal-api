import { Land } from '../land/query.js'

export const Query = {
  business: (_, { id }) => ({
      id,
  })
}

export const Business = {
  land: () => Land
}
