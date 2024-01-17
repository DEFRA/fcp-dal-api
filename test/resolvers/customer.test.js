import { faker } from '@faker-js/faker/locale/en_GB'
import { jest } from '@jest/globals'

import { Customer, CustomerBusiness } from '../../app/graphql/resolvers/customer/customer.js'
import { sitiAgriApiAuthorisationOrganisation } from '../../mocks/fixtures/authorisation.js'
import { person } from '../../mocks/fixtures/person.js'
import { createMessage } from '../../mocks/fixtures/messages.js'

const dataSources = {
  ruralPaymentsPortalApi: {
    getPersonSummaryByPersonId () {
      return [
        {
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
      ]
    },
    getAuthorisationByOrganisationId () {
      return sitiAgriApiAuthorisationOrganisation
    },
    getNotificationsByOrganisationIdAndPersonId: jest.fn()
  }
}

describe('Customer', () => {
  test('Customer.businesses', async () => {
    const response = await Customer.businesses({ id: 'mockCustomerId', name: 'name', sbi: 123123123 }, undefined, { dataSources })
    expect(response).toEqual([{ id: '4309257', name: 'company name', sbi: 123123123, customerId: 'mockCustomerId' }])
  })
})

describe('CustomerBusiness', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    dataSources.ruralPaymentsPortalApi.getNotificationsByOrganisationIdAndPersonId.mockImplementation(async () => {
      faker.seed(5109389384975743)
      return [createMessage(), createMessage()]
    })
  })

  test('CustomerBusiness.roles', async () => {
    const response = await CustomerBusiness.roles({ id: 'mockBusinessId', customerId: person.id }, undefined, { dataSources })
    expect(response).toEqual(['Business Partner'])
  })

  test('CustomerBusiness.privileges', async () => {
    const response = await CustomerBusiness.privileges({ id: 'mockBusinessId', customerId: person.id }, undefined, { dataSources })
    expect(response).toEqual([
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

  describe('CustomerBusiness.messages', () => {
    test('no args', async () => {
      const response = await CustomerBusiness.messages({ id: 'mockBusinessId', customerId: 'mockCustomerId' }, {}, { dataSources })
      expect(dataSources.ruralPaymentsPortalApi.getNotificationsByOrganisationIdAndPersonId).toHaveBeenCalledWith('mockBusinessId', 'mockCustomerId', 1, 1)
      expect(response).toEqual([
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

    test('showOnlyDeleted = false', async () => {
      const response = await CustomerBusiness.messages({ id: 'mockBusinessId', customerId: 'mockCustomerId' }, { showOnlyDeleted: false }, { dataSources })
      expect(dataSources.ruralPaymentsPortalApi.getNotificationsByOrganisationIdAndPersonId).toHaveBeenCalledWith('mockBusinessId', 'mockCustomerId', 1, 1)
      expect(response).toEqual([
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

    test('showOnlyDeleted = true', async () => {
      const response = await CustomerBusiness.messages({ id: 'mockBusinessId', customerId: 'mockCustomerId' }, { showOnlyDeleted: true }, { dataSources })
      expect(dataSources.ruralPaymentsPortalApi.getNotificationsByOrganisationIdAndPersonId).toHaveBeenCalledWith('mockBusinessId', 'mockCustomerId', 1, 1)
      expect(response).toEqual([
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

    test('pagination', async () => {
      const response = await CustomerBusiness.messages({ id: 'mockBusinessId', customerId: 'mockCustomerId' }, { pagination: { perPage: 5, page: 5 } }, { dataSources })
      expect(dataSources.ruralPaymentsPortalApi.getNotificationsByOrganisationIdAndPersonId).toHaveBeenCalledWith('mockBusinessId', 'mockCustomerId', 5, 5)
      expect(response).toEqual([
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
  })
})
