import pick from 'lodash.pick'
import { transformAuthenticateQuestionsAnswers } from '../../../app/transformers/authenticate/question-answers.js'
import {
  transformNotificationsToMessages,
  transformPersonPrivilegesToCustomerAuthorisedBusinessesPrivileges,
  transformPersonRolesToCustomerAuthorisedBusinessesRoles,
  transformPersonSummaryToCustomerAuthorisedBusinesses,
  transformPersonSummaryToCustomerAuthorisedFilteredBusiness
} from '../../../app/transformers/rural-payments-portal/customer.js'
import { sitiAgriAuthorisationOrganisation } from '../../../mocks/fixtures/authorisation.js'

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

const mockMessages = [
  {
    id: 5875045,
    personId: 5824285,
    organisationId: 8008496,
    messageId: 6062814,
    readAt: null,
    archivedAt: null,
    archive: null,
    createdAt: 8247074489993,
    title: 'Vomica aiunt alveus pectus volo argumentum derelinquo ambulo audacia certe.',
    body: '<p>Adversus crastinus suggero caste adhuc vomer accusamus acies iure.</p>',
    category: 'OrganisationLevel',
    bespokeNotificationId: null
  },
  {
    id: 2514276,
    personId: 7337791,
    organisationId: 7542172,
    messageId: 9588060,
    readAt: 21000,
    archivedAt: 8818544780296,
    archive: null,
    createdAt: 8818544780296,
    title: 'Cohibeo conspergo crux ulciscor cubo adamo aufero tepesco odit suppono.',
    body: '<p>Cruentus venia dedecor beatus vinco cultellus clarus.</p>',
    category: 'OrganisationLevel',
    bespokeNotificationId: null
  }
]
const parsedMessages = mockMessages.map(mockMessage => ({
  ...pick(mockMessage, ['id', 'title', 'body', 'archivedAt']),
  date: mockMessage.createdAt,
  read: !!mockMessage.readAt
}))
const organisationId = 123
const sitiAgriAuthorisationOrganisationData = sitiAgriAuthorisationOrganisation({ organisationId }).data
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
    expect(result).toEqual([parsedMessages[0]])
  })

  test('transformNotificationsToMessages - showOnlyDeleted', () => {
    const result = transformNotificationsToMessages(mockMessages, true)
    expect(result).toEqual([parsedMessages[1]])
  })

  test('transformNotificationsToMessages does not fail if messages empty', () => {
    const result = transformNotificationsToMessages()
    expect(result).toEqual([])
  })

  describe('transformPersonSummaryToCustomerAuthorisedFilteredBusiness', () => {
    test('should return null when no sbi matching', () => {
      expect(
        transformPersonSummaryToCustomerAuthorisedFilteredBusiness('99133320', 123456, [
          {
            id: '32323321',
            name: 'John Doe',
            sbi: 654321
          }
        ])
      ).toEqual(null)
    })

    test('should return id, name, sbi, and customerId when sbi is matching', () => {
      expect(
        transformPersonSummaryToCustomerAuthorisedFilteredBusiness('99133320', 123456, [
          {
            id: '32323321',
            name: 'John Doe',
            sbi: 123456
          }
        ])
      ).toEqual({
        id: '32323321',
        name: 'John Doe',
        customerId: '99133320',
        sbi: 123456
      })
    })
  })

  test('transformAuthenticateQuestionsAnswers', () => {
    const mockAuthenticateQuestionsResponse = {
      CRN: '123',
      Date: 'some date',
      Event: 'some event',
      Location: 'some location'
    }

    const result = transformAuthenticateQuestionsAnswers(mockAuthenticateQuestionsResponse)

    expect(result).toEqual({
      memorableDate: 'some date',
      memorableEvent: 'some event',
      memorablePlace: 'some location'
    })
  })

  test('transformNotificationsToMessages does not fail if response is empty', () => {
    const result = transformAuthenticateQuestionsAnswers()

    expect(result).toEqual({
      memorableDate: undefined,
      memorableEvent: undefined,
      memorablePlace: undefined
    })
  })
})
