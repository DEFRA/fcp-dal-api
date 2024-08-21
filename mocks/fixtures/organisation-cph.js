import files from '../utils/files.js'

const { getJSON } = files(import.meta.url)

export const organisationCPHInfo = orgId => {
  return getJSON(`./orgId/${orgId}/cph-info.json`)
}

export const organisationCPH = orgId => {
  return getJSON(`./orgId/${orgId}/cph.json`)
}
