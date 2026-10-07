import { jest } from '@jest/globals'
import { Mutation } from '../../../../app/graphql/resolvers/customer/mutation.js'

describe('Customer Mutations', () => {
  let mockDataSources

  const mockPerson = {
    id: 'currentId',
    title: 'currentTitle',
    otherTitle: 'currentOtherTitle',
    firstName: 'currentFirstName',
    middleName: 'currentMiddleName',
    lastName: 'currentLastName',
    dateOfBirth: 'currentDateOfBirth',
    landline: 'currentLandline',
    mobile: 'currentMobile',
    email: 'currentEmail',
    address: {
      address1: 'currentAddress1',
      address2: 'currentAddress2',
      address3: 'currentAddress3',
      address4: 'currentAddress4',
      address5: 'currentAddress5',
      pafOrganisationName: 'currentPafOrganisationName',
      flatName: 'currentFlatName',
      buildingNumberRange: 'currentBuildingNumberRange',
      buildingName: 'currentBuildingName',
      street: 'currentStreet',
      city: 'currentCity',
      county: 'currentCounty',
      postalCode: 'currentPostalCode',
      country: 'currentCountry',
      uprn: 'currentUprn',
      dependentLocality: 'currentDependentLocality',
      doubleDependentLocality: 'currentDoubleDependentLocality',
      addressTypeId: 'currentAddressTypeId'
    }
  }

  beforeEach(() => {
    mockDataSources = {
      mongoCustomer: {
        findPersonIdByCRN: jest.fn(),
        upsertPersonIdByCRN: jest.fn()
      },
      ruralPaymentsCustomer: {
        getPersonIdByCRN: jest.fn(),
        getPersonByPersonId: jest.fn(),
        updatePersonDetails: jest.fn(),
        validateEmail: jest.fn(),
        lockPerson: jest.fn(),
        deactivatePerson: jest.fn(),
        logger: { warn: jest.fn() },
        gatewayType: 'ruralPayments',
        request: {}
      }
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const updateMutations = [
    'updateCustomerAddress',
    'updateCustomerDateOfBirth',
    'updateCustomerEmail',
    'updateCustomerName',
    'updateCustomerPhone'
  ]

  describe.each(updateMutations)('%s', (mutationName) => {
    test('should call getCustomerByCRN with correct CRN', async () => {
      const input = { crn: 'crn' }

      mockDataSources.ruralPaymentsCustomer.getPersonIdByCRN.mockResolvedValue('currentId')
      mockDataSources.ruralPaymentsCustomer.getPersonByPersonId.mockResolvedValue(mockPerson)

      await Mutation[mutationName](null, { input }, { dataSources: mockDataSources })

      expect(mockDataSources.ruralPaymentsCustomer.getPersonIdByCRN).toHaveBeenCalledWith('crn')
    })

    test('should call updatePersonDetails with correct parameters', async () => {
      const input = { crn: 'crn', first: 'newFirstName' }

      mockDataSources.ruralPaymentsCustomer.getPersonIdByCRN.mockResolvedValue('currentId')
      mockDataSources.ruralPaymentsCustomer.getPersonByPersonId.mockResolvedValue(mockPerson)

      await Mutation[mutationName](null, { input }, { dataSources: mockDataSources })

      expect(mockDataSources.ruralPaymentsCustomer.updatePersonDetails).toHaveBeenCalledWith(
        'currentId',
        {
          id: 'currentId',
          title: 'currentTitle',
          otherTitle: 'currentOtherTitle',
          firstName: 'newFirstName',
          middleName: 'currentMiddleName',
          lastName: 'currentLastName',
          dateOfBirth: 'currentDateOfBirth',
          landline: 'currentLandline',
          mobile: 'currentMobile',
          email: 'currentEmail',
          address: {
            address1: 'currentAddress1',
            address2: 'currentAddress2',
            address3: 'currentAddress3',
            address4: 'currentAddress4',
            address5: 'currentAddress5',
            pafOrganisationName: 'currentPafOrganisationName',
            flatName: 'currentFlatName',
            buildingNumberRange: 'currentBuildingNumberRange',
            buildingName: 'currentBuildingName',
            street: 'currentStreet',
            city: 'currentCity',
            county: 'currentCounty',
            postalCode: 'currentPostalCode',
            country: 'currentCountry',
            uprn: 'currentUprn',
            dependentLocality: 'currentDependentLocality',
            doubleDependentLocality: 'currentDoubleDependentLocality',
            addressTypeId: 'currentAddressTypeId'
          }
        }
      )
    })

    test('should return success and customer CRN', async () => {
      const input = { crn: 'crn' }

      mockDataSources.ruralPaymentsCustomer.getPersonIdByCRN.mockResolvedValue('currentId')
      mockDataSources.ruralPaymentsCustomer.getPersonByPersonId.mockResolvedValue(mockPerson)

      const result = await Mutation[mutationName](null, { input }, { dataSources: mockDataSources })

      expect(result).toEqual({
        success: true,
        customer: { personId: 'currentId' }
      })
    })
  })

  describe.each(['updateCustomerEmail', 'updateCustomerAllFields'])(
    '%s email duplicate check',
    (mutationName) => {
      beforeEach(() => {
        mockDataSources.ruralPaymentsCustomer.getPersonIdByCRN.mockResolvedValue('currentId')
        mockDataSources.ruralPaymentsCustomer.getPersonByPersonId.mockResolvedValue(mockPerson)
      })

      test('should call validateEmail with the new email address', async () => {
        const input = { crn: 'crn', email: { address: 'new@example.com' } }

        mockDataSources.ruralPaymentsCustomer.validateEmail.mockResolvedValue({
          emailDuplicated: false
        })

        await Mutation[mutationName](null, { input }, { dataSources: mockDataSources })

        expect(mockDataSources.ruralPaymentsCustomer.validateEmail).toHaveBeenCalledWith(
          'new@example.com'
        )
      })

      test('should not update the customer and should throw when the email is a duplicate', async () => {
        const input = { crn: 'crn', email: { address: 'new@example.com' } }

        mockDataSources.ruralPaymentsCustomer.validateEmail.mockResolvedValue({
          emailDuplicated: true
        })

        await expect(
          Mutation[mutationName](null, { input }, { dataSources: mockDataSources })
        ).rejects.toMatchObject({
          message: 'Email address is already in use by another customer',
          extensions: { code: 'EMAIL_ALREADY_REGISTERED', http: { status: 400 } }
        })

        expect(mockDataSources.ruralPaymentsCustomer.updatePersonDetails).not.toHaveBeenCalled()
      })

      test('should update the customer when the email is not a duplicate', async () => {
        const input = { crn: 'crn', email: { address: 'new@example.com' } }

        mockDataSources.ruralPaymentsCustomer.validateEmail.mockResolvedValue({
          emailDuplicated: false
        })

        const result = await Mutation[mutationName](
          null,
          { input },
          { dataSources: mockDataSources }
        )

        expect(mockDataSources.ruralPaymentsCustomer.updatePersonDetails).toHaveBeenCalled()
        expect(result).toEqual({
          success: true,
          customer: { personId: 'currentId' }
        })
      })

      test('should not call validateEmail when the input has no email', async () => {
        const input = { crn: 'crn', first: 'newFirstName' }

        await Mutation[mutationName](null, { input }, { dataSources: mockDataSources })

        expect(mockDataSources.ruralPaymentsCustomer.validateEmail).not.toHaveBeenCalled()
      })

      test("should not call validateEmail when the email is unchanged from the customer's current email", async () => {
        const input = { crn: 'crn', email: { address: mockPerson.email } }

        const result = await Mutation[mutationName](
          null,
          { input },
          { dataSources: mockDataSources }
        )

        expect(mockDataSources.ruralPaymentsCustomer.validateEmail).not.toHaveBeenCalled()
        expect(mockDataSources.ruralPaymentsCustomer.updatePersonDetails).toHaveBeenCalled()
        expect(result).toEqual({
          success: true,
          customer: { personId: 'currentId' }
        })
      })

      test('should not call validateEmail when the email is unchanged except for casing', async () => {
        const input = { crn: 'crn', email: { address: mockPerson.email.toUpperCase() } }

        await Mutation[mutationName](null, { input }, { dataSources: mockDataSources })

        expect(mockDataSources.ruralPaymentsCustomer.validateEmail).not.toHaveBeenCalled()
      })
    }
  )

  describe.each(updateMutations)('%s audit trail', (mutationName) => {
    const info = { path: { key: mutationName, typename: 'Mutation', prev: undefined } }

    beforeEach(() => {
      mockDataSources.ruralPaymentsCustomer.getPersonIdByCRN.mockResolvedValue('currentId')
      mockDataSources.ruralPaymentsCustomer.getPersonByPersonId.mockResolvedValue(mockPerson)
    })

    test('records the personId/crn accounts and an updated person entity', async () => {
      const auditTrail = { recordAccount: jest.fn(), recordEntity: jest.fn() }
      const input = { crn: 'crn' }

      await Mutation[mutationName](
        null,
        { input },
        { dataSources: mockDataSources, auditTrail },
        info
      )

      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'personId', 'currentId')
      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'crn', 'crn')
      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
        entity: 'person',
        action: 'updated',
        entityid: 'crn'
      })
    })

    test('does not throw when no audit trail is supplied', async () => {
      const input = { crn: 'crn' }

      await Mutation[mutationName](null, { input }, { dataSources: mockDataSources }, info)
    })
  })

  describe('updateLockCustomer', () => {
    test('locks a customer through the GraphQL mutation', async () => {
      mockDataSources.mongoCustomer.findPersonIdByCRN.mockResolvedValue('personId')

      const auditTrail = { recordAccount: jest.fn(), recordEntity: jest.fn() }
      const input = { crn: 'crn', reason: 'my reason', note: 'my note' }

      await Mutation.updateLockCustomer(
        null,
        { input },
        { dataSources: mockDataSources, auditTrail },
        { path: { key: 'updateLockCustomer' } }
      )

      expect(mockDataSources.ruralPaymentsCustomer.lockPerson).toHaveBeenCalledWith(
        'personId',
        'my reason',
        'my note'
      )
      expect(mockDataSources.mongoCustomer.findPersonIdByCRN).toHaveBeenCalledWith('crn')
    })

    test('throws an error if no reason or note is provided', async () => {
      const auditTrail = { recordAccount: jest.fn(), recordEntity: jest.fn() }
      const input = { crn: 'crn' }

      await expect(
        Mutation.updateLockCustomer(
          null,
          { input },
          { dataSources: mockDataSources, auditTrail },
          { path: { key: 'updateLockCustomer' } }
        )
      ).rejects.toThrow('At least one of reason or note must be provided')
    })

    test('throws an error if empty reason or note is provided', async () => {
      const auditTrail = { recordAccount: jest.fn(), recordEntity: jest.fn() }
      const input = { crn: 'crn', note: '', reason: '' }

      await expect(
        Mutation.updateLockCustomer(
          null,
          { input },
          { dataSources: mockDataSources, auditTrail },
          { path: { key: 'updateLockCustomer' } }
        )
      ).rejects.toThrow('At least one of reason or note must be provided')
    })

    test('throws 404 if the person is not found', async () => {
      mockDataSources.mongoCustomer.findPersonIdByCRN.mockRejectedValue(new Error('Not Found'))
      mockDataSources.ruralPaymentsCustomer.getPersonIdByCRN.mockRejectedValue(
        new Error('Not Found')
      )

      const auditTrail = { recordAccount: jest.fn(), recordEntity: jest.fn() }
      const input = { crn: 'crn', reason: 'my reason' }

      await expect(
        Mutation.updateLockCustomer(
          null,
          { input },
          { dataSources: mockDataSources, auditTrail },
          { path: { key: 'updateLockCustomer' } }
        )
      ).rejects.toThrow('Not Found')
    })

    test('records the personId account and a locked person entity', async () => {
      mockDataSources.mongoCustomer.findPersonIdByCRN.mockResolvedValue('personId')

      const auditTrail = { recordAccount: jest.fn(), recordEntity: jest.fn() }
      const input = { crn: 'crn', reason: 'my reason', note: 'my note' }
      const info = { path: { key: 'updateLockCustomer' } }

      await Mutation.updateLockCustomer(
        null,
        { input },
        { dataSources: mockDataSources, auditTrail },
        info
      )

      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'personId', 'personId')
      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'crn', 'crn')
      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
        entity: 'person',
        action: 'locked',
        entityid: 'personId'
      })
    })

    test('throws 404 and records undefined personId if the person is not found', async () => {
      const info = { path: { key: 'updateLockCustomer' } }
      const input = { crn: 'crn', reason: 'my reason' }
      mockDataSources.mongoCustomer.findPersonIdByCRN.mockRejectedValue(new Error('Not Found'))
      mockDataSources.ruralPaymentsCustomer.getPersonIdByCRN.mockRejectedValue(
        new Error('Not Found')
      )

      const auditTrail = { recordAccount: jest.fn(), recordEntity: jest.fn() }

      await expect(
        Mutation.updateLockCustomer(
          null,
          { input },
          { dataSources: mockDataSources, auditTrail },
          { path: { key: 'updateLockCustomer' } }
        )
      ).rejects.toThrow('Not Found')

      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'personId', undefined)
      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'crn', 'crn')
      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
        entity: 'person',
        action: 'locked',
        entityid: undefined
      })
    })
  })

  describe('updateDeactivateCustomer', () => {
    const info = { path: { key: 'updateDeactivateCustomer' } }
    let auditTrail

    beforeEach(() => {
      auditTrail = { recordAccount: jest.fn(), recordEntity: jest.fn() }
    })

    const deactivate = (input) =>
      Mutation.updateDeactivateCustomer(
        null,
        { input },
        { dataSources: mockDataSources, auditTrail },
        info
      )

    test('deactivates the person found for the crn', async () => {
      // arrange
      mockDataSources.mongoCustomer.findPersonIdByCRN.mockResolvedValue('personId')

      // act
      const result = await deactivate({ crn: 'crn', reason: 'my reason', note: 'my note' })

      // assert
      expect(mockDataSources.mongoCustomer.findPersonIdByCRN).toHaveBeenCalledWith('crn')
      expect(mockDataSources.ruralPaymentsCustomer.deactivatePerson).toHaveBeenCalledWith(
        'personId',
        'my reason',
        'my note'
      )
      expect(result).toEqual({ success: true, customer: { personId: 'personId' } })
    })

    test.each([
      ['reason is empty', { reason: '', note: 'my note' }],
      ['note is empty', { reason: 'my reason', note: '' }],
      ['reason is only spaces', { reason: '   ', note: 'my note' }],
      ['note is only spaces', { reason: 'my reason', note: '   ' }]
    ])('refuses without calling upstream when %s', async (_, fields) => {
      // arrange / act
      const error = await deactivate({ crn: 'crn', ...fields }).catch((e) => e)

      // assert
      expect(error.message).toBe('Both reason and note must be provided')
      expect(error.extensions.code).toBe('REASON_AND_NOTE_REQUIRED')
      expect(mockDataSources.mongoCustomer.findPersonIdByCRN).not.toHaveBeenCalled()
      expect(mockDataSources.ruralPaymentsCustomer.deactivatePerson).not.toHaveBeenCalled()
    })

    test('sends the reason and note without surrounding spaces', async () => {
      // arrange
      mockDataSources.mongoCustomer.findPersonIdByCRN.mockResolvedValue('personId')

      // act
      await deactivate({ crn: 'crn', reason: '  my reason ', note: ' my note  ' })

      // assert
      expect(mockDataSources.ruralPaymentsCustomer.deactivatePerson).toHaveBeenCalledWith(
        'personId',
        'my reason',
        'my note'
      )
    })

    const deactivatedPersonEntity = { entity: 'person', action: 'deactivated', entityid: 'crn' }

    test('audits the crn, the personId and a deactivated person', async () => {
      // arrange
      mockDataSources.mongoCustomer.findPersonIdByCRN.mockResolvedValue('personId')

      // act
      await deactivate({ crn: 'crn', reason: 'my reason', note: 'my note' })

      // assert
      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'crn', 'crn')
      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'personId', 'personId')
      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, deactivatedPersonEntity)
    })

    test('audits the crn when the reason or note is refused', async () => {
      // arrange / act
      await deactivate({ crn: 'crn', reason: '', note: 'my note' }).catch(() => {})

      // assert
      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'crn', 'crn')
      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, deactivatedPersonEntity)
    })

    test('audits the crn but no personId when the person is not found', async () => {
      // arrange
      mockDataSources.mongoCustomer.findPersonIdByCRN.mockResolvedValue(null)
      mockDataSources.ruralPaymentsCustomer.getPersonIdByCRN.mockRejectedValue(
        new Error('Not Found')
      )

      // act
      const error = await deactivate({ crn: 'crn', reason: 'r', note: 'n' }).catch((e) => e)

      // assert
      expect(error.message).toBe('Not Found')
      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'crn', 'crn')
      expect(auditTrail.recordAccount).not.toHaveBeenCalledWith(info, 'personId', expect.anything())
      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, deactivatedPersonEntity)
      expect(mockDataSources.ruralPaymentsCustomer.deactivatePerson).not.toHaveBeenCalled()
    })

    test('audits the crn and personId when the upstream deactivate fails', async () => {
      // arrange
      mockDataSources.mongoCustomer.findPersonIdByCRN.mockResolvedValue('personId')
      mockDataSources.ruralPaymentsCustomer.deactivatePerson.mockRejectedValue(
        new Error('Upstream error')
      )

      // act
      const error = await deactivate({ crn: 'crn', reason: 'r', note: 'n' }).catch((e) => e)

      // assert
      expect(error.message).toBe('Upstream error')
      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'crn', 'crn')
      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'personId', 'personId')
      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, deactivatedPersonEntity)
    })
  })
})
