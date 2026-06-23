import { config } from '../config.js'
import { BadRequest } from '../errors/graphql.js'

export const getSearchOffsetAndLimit = (pagination) => {
  const perPage = pagination?.perPage ?? config.get('kits.requestPageSize')
  const page = pagination?.page ?? 1

  if (page < 1) {
    throw new BadRequest('Pagination page must be 1 or greater')
  }
  if (perPage < 1) {
    throw new BadRequest('Pagination perPage must be 1 or greater')
  }

  return { offset: (page - 1) * perPage, limit: perPage }
}
