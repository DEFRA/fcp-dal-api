import { faker } from '@faker-js/faker/locale/en_GB'

import {
  transformPersonRolesToCustomerAuthorisedBusinessesRoles,
  transformPersonPrivilegesToCustomerAuthorisedBusinessesPrivileges,
  transformPersonSummaryToCustomerAuthorisedBusinesses,
  transformNotificationsToMessages
} from '../../../app/transformers/rural-payments-portal/customer.js'
import { sitiAgriApiAuthorisationOrganisation } from '../../../mocks/fixtures/authorisation.js'
import { createMessage } from '../../../mocks/fixtures/messages.js'
import { person } from '../../../mocks/fixtures/person.js'

const mockOrganisationPersonSummary = {
  id: '4309257',
  name: 'company name',
  sbi: 123123123,
  additionalSbiIds: [],
  confirmed: true,
  lastUpdatedOn: null,
  landConfirmed: null,
  deactivated: false,
  locked: true,
  unreadNotificationCount: 3,
  readNotificationCount: 0
}

faker.seed(5109389384975743)
const mockMessages = [createMessage(), createMessage()]

describe('Customer transformer', () => {
  test('transformPersonRolesToCustomerAuthorisedBusinessesRoles', () => {
    const result = transformPersonSummaryToCustomerAuthorisedBusinesses('customerId', [mockOrganisationPersonSummary])
    expect(result).toEqual([{ customerId: 'customerId', id: '4309257', name: 'company name', sbi: 123123123 }])
  })

  test('transformPersonRolesToCustomerAuthorisedBusinessesRoles', () => {
    const result = transformPersonRolesToCustomerAuthorisedBusinessesRoles(person.id, sitiAgriApiAuthorisationOrganisation.personRoles)
    expect(result).toEqual(['Business Partner'])
  })

  test('transformPersonPrivilegesToCustomerAuthorisedBusinessesPrivileges', () => {
    const result = transformPersonPrivilegesToCustomerAuthorisedBusinessesPrivileges(
      person.id,
      sitiAgriApiAuthorisationOrganisation.personPrivileges
    )
    expect(result).toEqual([
      'Full permission - business',
      'SUBMIT - CS APP - SA',
      'SUBMIT - CS AGREE - SA',
      'Amend - land',
      'Amend - entitlement',
      'Submit - bps',
      'SUBMIT - BPS - SA',
      'AMEND - ENTITLEMENT - SA',
      'AMEND - LAND - SA',
      'Submit - cs app',
      'Submit - cs agree',
      'ELM_APPLICATION_SUBMIT'
    ])
  })

  test('transformNotificationsToMessages', () => {
    const result = transformNotificationsToMessages(mockMessages, false)
    expect(result).toEqual([
      {
        id: 458240,
        title: 'Volva vobis debilito autem acidus vita utrimque. Cunctatio theologus vinitor. Et utroque aro ascisco demoror calcar ad.',
        date: 6590869576679,
        body: '<p>Volaticus voro tenuis vicinus avarus.</p>',
        read: false,
        archivedAt: null
      }
    ])
  })

  test('transformNotificationsToMessages - showOnlyDeleted', () => {
    const result = transformNotificationsToMessages(mockMessages, true)
    expect(result).toEqual([
      {
        id: 5536220,
        title: 'Occaecati animadverto tempora vere quas peior adsum una. Arcus adfero cruentus vociferor. Conor decumbo assentator consectetur tergum sunt.',
        date: 5423726958601,
        body: '<p>Amicitia aurum deleo delectus amissio.</p>',
        read: false,
        archivedAt: 222179046402
      }
    ])
  })

  test('transformNotificationsToMessages does not fail if messages empty', () => {
    const result = transformNotificationsToMessages()
    expect(result).toEqual([])
  })
})
