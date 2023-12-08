import { faker } from '@faker-js/faker/locale/en_GB'

export const organisationPersonSummary = {
  id: '4309257',
  name: faker.company.name(),
  sbi: parseInt(faker.string.numeric(9)),
  additionalSbiIds: [],
  confirmed: faker.datatype.boolean(),
  lastUpdatedOn: null,
  landConfirmed: null,
  deactivated: faker.datatype.boolean(),
  locked: faker.datatype.boolean(),
  unreadNotificationCount: 3,
  readNotificationCount: 0
}
