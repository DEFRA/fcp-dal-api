import { faker } from '@faker-js/faker/locale/en_GB'
import logger from '../../app/utils/logger.js'
import files from '../utils/files.js'

const { getJSON } = files(import.meta.url)

export const createMessageMock = (attributes = {}) => ({
  id: +faker.string.numeric(7),
  personId: +faker.string.numeric(7),
  organisationId: +faker.string.numeric(7),
  messageId: +faker.string.numeric(7),
  readAt: faker.datatype.boolean() ? faker.date.anytime().getDate() * 1000 : null,
  archivedAt: null,
  archive: null,
  createdAt: +faker.string.numeric(13),
  title: faker.lorem.sentence(10),
  body: `<p>${faker.lorem.sentence()}</p>`,
  category: 'OrganisationLevel',
  bespokeNotificationId: null,
  ...attributes
})

export const createMessages = (attributes = {}, messageCount = 5) => {
  try {
    return getJSON(`./personId/${attributes.personId}/messages.json`)
  } catch (error) {
    logger.debug('#Mock #Fixtures #createMessages - Generating mock data')
    const seedReference = attributes.personId || attributes.organisationId
    if (seedReference) {
      faker.seed(+seedReference)
    }

    const messages = [...Array(messageCount)].map(() => createMessageMock(attributes))

    const messagesRead = messages.filter(({ readAt }) => readAt)
    const messagesUnread = messages.filter(({ readAt }) => !readAt)

    return {
      notifications: messages,
      resultCount: messageCount,
      readCount: messagesRead.length,
      unreadCount: messagesUnread.length
    }
  }
}
