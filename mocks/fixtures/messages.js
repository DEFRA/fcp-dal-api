import { faker } from '@faker-js/faker/locale/en_GB'

export const createMessage = (params = {}) => ({
  id: +faker.string.numeric(7),
  personId: +faker.string.numeric(7),
  organisationId: +faker.string.numeric(7),
  messageId: +faker.string.numeric(7),
  readAt: null,
  archivedAt: faker.datatype.boolean() ? +faker.string.numeric(13) : null,
  archive: null,
  createdAt: +faker.string.numeric(13),
  title: faker.lorem.text(),
  body: `<p>${faker.lorem.sentence()}</p>`,
  category: 'OrganisationLevel',
  bespokeNotificationId: null,
  ...params
})

export const message = createMessage()
export const messages = [createMessage(), createMessage(), createMessage()]
