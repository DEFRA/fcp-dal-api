import files from '../utils/files.js'

const { getJSON } = files(import.meta.url)

export const personById = (attributes = {}) => {
  if (attributes.customerReferenceNumber) {
    const personIdCrnMap = getJSON('./personId/personIdCrnMap.json')
    attributes.id = personIdCrnMap[attributes.customerReferenceNumber]
  }
  return getJSON(`./personId/${attributes.id}/detail.json`)
}
