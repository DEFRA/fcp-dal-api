import files from '../utils/files.js'

const { getJSON } = files(import.meta.url)

export const messages = (personId, page = 1, size = 3) => {
  const response = getJSON(`./personId/${personId}/messages.json`)
  const end = size * page
  const start = end - size

  return {
    ...response,
    notifications: response.notifications.slice(start, end)
  }
}
