import { jest } from '@jest/globals'

import { Query } from '../../../../app/graphql/resolvers/customer/query.js'

const dataSources = {
  ruralPaymentsCustomer: {
    customerEmailExistsByEmailAddress: jest.fn()
  },
  mongoCustomer: {
    findPersonIdByCRN: jest.fn()
  }
}

describe('Query', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('CustomerEmail', () => {
    test('returns mail address and sets address in use to true when email is in use', async () => {
      dataSources.ruralPaymentsCustomer.customerEmailExistsByEmailAddress.mockResolvedValue({
        emailDuplicated: true
      })

      const response = await Query.customerEmail(
        undefined,
        { emailAddress: 'test@example.com' },
        {
          dataSources
        }
      )

      expect(
        dataSources.ruralPaymentsCustomer.customerEmailExistsByEmailAddress
      ).toHaveBeenCalledWith('test@example.com')
      expect(response).toMatchObject({
        emailAddress: 'test@example.com',
        addressInUse: true
      })
    })

    test('returns mail address and sets address in use to false when email is not already in use', async () => {
      dataSources.ruralPaymentsCustomer.customerEmailExistsByEmailAddress.mockResolvedValue({
        emailDuplicated: false
      })

      const response = await Query.customerEmail(
        undefined,
        { emailAddress: 'test@example.com' },
        {
          dataSources
        }
      )
      expect(response).toMatchObject({
        emailAddress: 'test@example.com',
        addressInUse: false
      })
    })
  })
})
