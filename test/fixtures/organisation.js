import files from './files.js'

const { getJSON } = files(import.meta.url)

export const organisationByOrgId = (orgId) => {
  return getJSON(`./orgId/${orgId}/organisation.json`)
}

export const organisationPeopleByOrgId = (orgId) => {
  return getJSON(`./orgId/${orgId}/organisation-people.json`)
}

export const organisationBySbi = (sbi) => {
  return getJSON(`./sbi/${sbi}/organisation-search.json`)
}

export const organisationApplicationsByOrgId = (orgId) => {
  return getJSON(`./orgId/${orgId}/organisation-applications.json`)
}

export const organisationPersonSummary = (attributes = {}) => {
  return getJSON(`./personId/${attributes.id}/organisationSummary.json`)
}
