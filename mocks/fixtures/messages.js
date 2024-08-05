import files from '../utils/files.js'

const { getJSON } = files(import.meta.url)

export const messages = (personId) => {
  return getJSON(`./personId/${personId}/messages.json`)
}
