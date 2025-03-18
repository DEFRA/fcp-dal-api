import files from '../utils/files.js'

const { getJSON } = files(import.meta.url)

export const sitiAgriAuthorisationOrganisation = (attributes = {}) => {
  return getJSON(`./orgId/${attributes.organisationId}/siti-agri-authorisation-organisation.json`)
}
