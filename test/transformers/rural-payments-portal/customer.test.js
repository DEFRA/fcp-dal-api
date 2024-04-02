import { faker } from '@faker-js/faker/locale/en_GB'

import {
  transformNotificationsToMessages,
  transformPersonPrivilegesToCustomerAuthorisedBusinessesPrivileges,
  transformPersonRolesToCustomerAuthorisedBusinessesRoles,
  transformPersonSummaryToCustomerAuthorisedBusinesses, transformPersonSummaryToCustomerAuthorisedFilteredBusiness
} from '../../../app/transformers/rural-payments-portal/customer.js'
import { sitiAgriAuthorisationOrganisation } from '../../../mocks/fixtures/authorisation.js'
import { createMessage } from '../../../mocks/fixtures/messages.js'

// const person = personById()
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

faker.seed(5109389384975741)
const mockMessages = [createMessage(), createMessage()]
const organisationId = 123
const sitiAgriAuthorisationOrganisationData = sitiAgriAuthorisationOrganisation({ organisationId })
const personId = sitiAgriAuthorisationOrganisationData.personRoles[0].personId

describe('Customer transformer', () => {
  test('transformPersonRolesToCustomerAuthorisedBusinessesRoles', () => {
    const result = transformPersonSummaryToCustomerAuthorisedBusinesses('customerId', [mockOrganisationPersonSummary])
    expect(result).toEqual([{ customerId: 'customerId', id: '4309257', name: 'company name', sbi: 123123123 }])
  })

  test('transformPersonRolesToCustomerAuthorisedBusinessesRoles', () => {
    const result = transformPersonRolesToCustomerAuthorisedBusinessesRoles(personId, sitiAgriAuthorisationOrganisationData.personRoles)
    expect(result).toEqual(['Business Partner'])
  })

  test('transformPersonPrivilegesToCustomerAuthorisedBusinessesPrivileges', () => {
    const result = transformPersonPrivilegesToCustomerAuthorisedBusinessesPrivileges(
      personId,
      sitiAgriAuthorisationOrganisationData.personPrivileges
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
        id: 5875045,
        title: 'Vomica aiunt alveus pectus volo argumentum derelinquo ambulo audacia certe.',
        date: 8247074489993,
        body: '<p>Adversus crastinus suggero caste adhuc vomer accusamus acies iure.</p>',
        read: false,
        archivedAt: null
      }
    ])
  })

  test('transformNotificationsToMessages - showOnlyDeleted', () => {
    const result = transformNotificationsToMessages(mockMessages, true)
    expect(result).toEqual([
      {
        id: 2514276,
        title: 'Venia dedecor beatus vinco cultellus clarus terebro voluptate assumenda tot.',
        date: 6333830175753,
        body: '<p>Autem thema blandior verus comprehendo cursim aliquid deleo consequuntur.</p>',
        read: false,
        archivedAt: 2881854478029
      }
    ])
  })

  test('transformNotificationsToMessages does not fail if messages empty', () => {
    const result = transformNotificationsToMessages()
    expect(result).toEqual([])
  })

  test('transformPersonSummaryToCustomerAuthorisedFilteredBusiness', () => {
    test('should return null when no sbi matching', () => {
      expect(transformPersonSummaryToCustomerAuthorisedFilteredBusiness(
        '99133320',
        123456,
        [{
          id: '32323321',
          name: 'John Doe',
          sbi: 654321
        }]
      )).toEqual(null)
    })

    test('should return id, name, sbi, and customerId when sbi is matching', () => {
      expect(transformPersonSummaryToCustomerAuthorisedFilteredBusiness(
        '99133320',
        123456,
        [{
          id: '32323321',
          name: 'John Doe',
          sbi: 123456
        }]
      )).toEqual({
        id: '32323321',
        name: 'John Doe',
        customerId: '99133320',
        sbi: 123456
      })
    })
  })
})
