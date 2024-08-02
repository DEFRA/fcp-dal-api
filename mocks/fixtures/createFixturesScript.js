import { faker } from '@faker-js/faker/locale/en_GB'
import fs from 'fs'
import files from '../utils/files.js'
import { createMessages } from './messages.js'
import { organisationPersonSummary } from './organisation.js'
import { personById } from './person.js'

const { getJSON } = files(import.meta.url)

const orgId = '5625145'
const org = getJSON(`./orgId/${orgId}/organisation.json`)._data
const orgPeople = getJSON(`./orgId/${orgId}/organisation-people.json`)._data

for (const person of orgPeople) {
  fs.rmSync(`./mocks/fixtures/personId/${person.id}`, { recursive: true, force: true })
  fs.mkdirSync(`./mocks/fixtures/personId/${person.id}`, { recursive: true })

  const detail = personById({
    id: person.id,
    firstName: person.firstName,
    middleName: person.lastName,
    lastName: person.lastName
  })
  fs.writeFileSync(`./mocks/fixtures/personId/${person.id}/detail.json`, JSON.stringify(detail, null, 2))

  const messages = createMessages(
    {
      personId: person.id,
      organisationId: orgId,
      title: `Permission changed for ${person.firstName} ${person.lastName}`
    },
    faker.number.int({ min: 1, max: 10 })
  )

  messages.notifications.forEach(message => {
    const date = new Date(faker.date.past({ years: 2 }))
    message.body = `<p>Your permission for ${person.firstName} ${person.lastName} was changed on ${date.toDateString()}</p>`
  })
  fs.writeFileSync(`./mocks/fixtures/personId/${person.id}/messages.json`, JSON.stringify(messages, null, 2))

  const organisationSummary = organisationPersonSummary({
    id: orgId,
    sbi: org.sbi,
    name: org.name
  })
  fs.writeFileSync(`./mocks/fixtures/personId/${person.id}/organisationSummary.json`, JSON.stringify(organisationSummary, null, 2))
}
