import { transformAuthenticateQuestionsAnswers } from '../../../../app/transformers/authenticate/question-answers.js'
import {
  transformNotificationsToMessages,
  transformPersonSummaryToCustomerAuthorisedBusinesses,
  transformPersonSummaryToCustomerAuthorisedFilteredBusiness
} from '../../../../app/transformers/rural-payments/customer.js'
import { organisationPeopleByOrgId } from '../../../fixtures/organisation.js'

const organisationId = '5565448'
const personSummary = organisationPeopleByOrgId(organisationId)

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

describe('Customer transformer', () => {
  test('transformPersonRolesToCustomerAuthorisedBusinessesRoles', () => {
    const result = transformPersonSummaryToCustomerAuthorisedBusinesses({}, personSummary._data)

    expect(result).toEqual([
      { organisationId: 5263421 },
      { organisationId: 5302028 },
      { organisationId: 5311964 },
      { organisationId: 5331098 },
      { organisationId: 5778203 }
    ])
  })

  test('transformNotificationsToMessages', () => {
    const result = transformNotificationsToMessages(mockMessages, false)
    expect(result).toEqual([
      {
        id: 5875045,
        subject: 'Vomica aiunt alveus pectus volo argumentum derelinquo ambulo audacia certe.',
        date: '2231-05-05T06:01:29.993Z',
        body: '<p>Adversus crastinus suggero caste adhuc vomer accusamus acies iure.</p>',
        read: false,
        deleted: false
      },
      {
        id: 2514276,
        subject: 'Cohibeo conspergo crux ulciscor cubo adamo aufero tepesco odit suppono.',
        date: '2249-06-13T11:46:20.296Z',
        body: '<p>Cruentus venia dedecor beatus vinco cultellus clarus.</p>',
        read: true,
        deleted: true
      }
    ])
  })

  test('transformNotificationsToMessages does not fail if messages empty', () => {
    const result = transformNotificationsToMessages()
    expect(result).toEqual([])
  })

  describe('transformPersonSummaryToCustomerAuthorisedFilteredBusiness', () => {
    test('should return null when no sbi matching', () => {
      expect(
        transformPersonSummaryToCustomerAuthorisedFilteredBusiness({}, [
          {
            id: '32323321',
            name: 'John Doe',
            sbi: 654321
          }
        ])
      ).toEqual(null)
    })

    test('should return id, name, sbi, and personId when sbi is matching', () => {
      expect(
        transformPersonSummaryToCustomerAuthorisedFilteredBusiness({ sbi: '123456' }, [
          {
            id: '32323321',
            name: 'John Doe',
            sbi: 123456
          }
        ])
      ).toEqual({
        organisationId: '32323321',
        name: 'John Doe',
        sbi: '123456'
      })
    })
  })

  test('transformAuthenticateQuestionsAnswers', () => {
    const mockAuthenticateQuestionsResponse = {
      memorableDate: 'some date',
      memorableEvent: 'some event',
      memorableLocation: 'some location'
    }

    const result = transformAuthenticateQuestionsAnswers(mockAuthenticateQuestionsResponse)

    expect(result).toEqual({
      isFound: true,
      memorableDate: 'some date',
      memorableEvent: 'some event',
      memorableLocation: 'some location',
      updatedAt: undefined
    })
  })

  test('transformNotificationsToMessages does not fail if response is empty', () => {
    const result = transformAuthenticateQuestionsAnswers(null)

    expect(result).toEqual({
      isFound: false,
      memorableDate: undefined,
      memorableEvent: undefined,
      memorableLocation: undefined,
      updatedAt: undefined
    })
  })

  test('transformAuthenticateQuestionsAnswers with partially null results', () => {
    const mockAuthenticateQuestionsResponse = {
      memorableDate: 'some date',
      memorableEvent: null,
      memorableLocation: ''
    }

    const result = transformAuthenticateQuestionsAnswers(mockAuthenticateQuestionsResponse)

    expect(result).toEqual({
      isFound: true,
      memorableDate: 'some date',
      memorableEvent: null,
      memorableLocation: '',
      updatedAt: undefined
    })
  })
})
