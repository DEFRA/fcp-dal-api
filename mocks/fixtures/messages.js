import { faker } from '@faker-js/faker/locale/en_GB'

const createMessageMock = (attributes = {}) => ({
  id: +faker.string.numeric(7),
  personId: +faker.string.numeric(7),
  organisationId: +faker.string.numeric(7),
  messageId: +faker.string.numeric(7),
  readAt: null,
  archivedAt: faker.datatype.boolean() ? +faker.string.numeric(13) : null,
  archive: null,
  createdAt: +faker.string.numeric(13),
  title: faker.lorem.sentence(10),
  body: `<p>${faker.lorem.sentence()}</p>`,
  category: 'OrganisationLevel',
  bespokeNotificationId: null,
  ...attributes
})

export const createMessage = (attributes = {}) => {
  return createMessageMock(attributes)
}
