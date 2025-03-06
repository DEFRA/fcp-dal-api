import files from '../utils/files.js'

const { getJSON } = files(import.meta.url)

export const authenticateAnswers = (crn) => {
  return getJSON(`./crn/${crn}/authenticate.json`)
}
