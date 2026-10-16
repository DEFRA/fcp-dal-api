import { vi } from 'vitest'
import { config } from '../../../../app/config.js'
import { Unauthorized } from '../../../../app/errors/graphql.js'
import { Mutation } from '../../../../app/graphql/resolvers/customer/mutation.js'
import { logger } from '../../../../app/logger/logger.js'

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
        findPersonIdByCRN: vi.fn(),
        upsertPersonIdByCRN: vi.fn()
      },
      ruralPaymentsCustomer: {
        getPersonIdByCRN: vi.fn(),
        getPersonByPersonId: vi.fn(),
        getExternalPerson: vi.fn(),
        updatePersonDetails: vi.fn(),
        validateEmail: vi.fn(),
        lockPerson: vi.fn(),
        deactivatePerson: vi.fn(),
        saveAuthenticateAnswersByCRN: vi.fn(),
        unlockPerson: vi.fn(),
        logger: { warn: vi.fn() },
        gatewayType: 'ruralPayments',
        request: {},
        confirmEmail: vi.fn(),
        saveEmailValidation: vi.fn(),
        sendVerificationEmail: vi.fn()
      }
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
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
      const auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
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

      const auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
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
      const auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
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
      const auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
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

      const auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
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

      const auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
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
        entityid: 'crn'
      })
    })

    test('throws 404 and records undefined personId if the person is not found', async () => {
      const info = { path: { key: 'updateLockCustomer' } }
      const input = { crn: 'crn', reason: 'my reason' }
      mockDataSources.mongoCustomer.findPersonIdByCRN.mockRejectedValue(new Error('Not Found'))
      mockDataSources.ruralPaymentsCustomer.getPersonIdByCRN.mockRejectedValue(
        new Error('Not Found')
      )

      const auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }

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
        entityid: 'crn'
      })
    })
  })

  describe('sendConfirmEmailAddressEmail', () => {
    const defraIdContext = { crn: () => 'crn' }

    beforeEach(() => {
      mockDataSources.ruralPaymentsCustomer.getExternalPerson.mockResolvedValue(mockPerson)
      mockDataSources.ruralPaymentsCustomer.confirmEmail.mockResolvedValue({
        id: 'digitalContactPartyId'
      })
    })

    test('confirms the email to obtain the digitalContactPartyId, then sends the verification email', async () => {
      await Mutation.sendConfirmEmailAddressEmail(
        null,
        {},
        { dataSources: mockDataSources, defraIdContext }
      )

      expect(mockDataSources.ruralPaymentsCustomer.confirmEmail).toHaveBeenCalledWith(
        'currentId',
        'currentEmail'
      )
      expect(mockDataSources.ruralPaymentsCustomer.sendVerificationEmail).toHaveBeenCalledWith(
        'digitalContactPartyId'
      )
    })

    test('saves an email validation record before sending the verification email', async () => {
      await Mutation.sendConfirmEmailAddressEmail(
        null,
        {},
        { dataSources: mockDataSources, defraIdContext }
      )

      expect(mockDataSources.ruralPaymentsCustomer.saveEmailValidation).toHaveBeenCalledWith({
        customerReference: 'crn',
        partyDigitalContactId: 'digitalContactPartyId',
        email: 'currentEmail',
        linkSentDate: expect.any(String)
      })

      const [saveCallOrder, sendCallOrder] = [
        mockDataSources.ruralPaymentsCustomer.saveEmailValidation.mock.invocationCallOrder[0],
        mockDataSources.ruralPaymentsCustomer.sendVerificationEmail.mock.invocationCallOrder[0]
      ]
      expect(saveCallOrder).toBeLessThan(sendCallOrder)
    })

    test('returns success', async () => {
      const result = await Mutation.sendConfirmEmailAddressEmail(
        null,
        {},
        { dataSources: mockDataSources, defraIdContext }
      )

      expect(result).toEqual({
        success: true
      })
    })

    test('throws NotFound and does not attempt to send an email when the customer has no email address', async () => {
      mockDataSources.ruralPaymentsCustomer.getExternalPerson.mockResolvedValue({
        ...mockPerson,
        email: null
      })

      await expect(
        Mutation.sendConfirmEmailAddressEmail(
          null,
          {},
          { dataSources: mockDataSources, defraIdContext }
        )
      ).rejects.toMatchObject({
        message: 'Customer has no email address',
        extensions: { code: 'NOT FOUND', http: { status: 404 } }
      })

      expect(mockDataSources.ruralPaymentsCustomer.confirmEmail).not.toHaveBeenCalled()
      expect(mockDataSources.ruralPaymentsCustomer.saveEmailValidation).not.toHaveBeenCalled()
      expect(mockDataSources.ruralPaymentsCustomer.sendVerificationEmail).not.toHaveBeenCalled()
    })

    test.each([true, 'true'])(
      'throws EMAIL_ALREADY_VERIFIED and does not attempt to send an email when emailValidated is %p',
      async (emailValidated) => {
        mockDataSources.ruralPaymentsCustomer.getExternalPerson.mockResolvedValue({
          ...mockPerson,
          emailValidated
        })

        await expect(
          Mutation.sendConfirmEmailAddressEmail(
            null,
            {},
            { dataSources: mockDataSources, defraIdContext }
          )
        ).rejects.toMatchObject({
          message: 'Customer email address is already verified',
          extensions: { code: 'EMAIL_ALREADY_VERIFIED', http: { status: 400 } }
        })

        expect(mockDataSources.ruralPaymentsCustomer.confirmEmail).not.toHaveBeenCalled()
        expect(mockDataSources.ruralPaymentsCustomer.saveEmailValidation).not.toHaveBeenCalled()
        expect(mockDataSources.ruralPaymentsCustomer.sendVerificationEmail).not.toHaveBeenCalled()
      }
    )

    test('records the personId/crn accounts and an entity for the audit trail', async () => {
      const auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
      const info = {
        path: { key: 'sendConfirmEmailAddressEmail', typename: 'Mutation', prev: undefined }
      }

      await Mutation.sendConfirmEmailAddressEmail(
        null,
        {},
        { dataSources: mockDataSources, auditTrail, defraIdContext },
        info
      )

      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'crn', 'crn')
      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'personId', 'currentId')
      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
        entity: 'person',
        action: 'verification-email-sent',
        entityid: 'crn'
      })
    })

    test('throws Unauthorized and does not look up the customer when there is no Defra ID context', async () => {
      await expect(
        Mutation.sendConfirmEmailAddressEmail(null, {}, { dataSources: mockDataSources })
      ).rejects.toBeInstanceOf(Unauthorized)

      expect(mockDataSources.ruralPaymentsCustomer.getExternalPerson).not.toHaveBeenCalled()
    })

    describe('email verification link logging', () => {
      const mockConfig = (values) =>
        vi.spyOn(config, 'get').mockImplementation((path) => values[path])

      beforeEach(() => {
        mockDataSources.ruralPaymentsCustomer.getExternalPerson.mockResolvedValue({
          ...mockPerson,
          email: 'test+user@example.com'
        })
      })

      afterEach(() => {
        vi.restoreAllMocks()
      })

      test('logs the email verification link when customer emails are disabled', async () => {
        mockConfig({
          'ruralPayments.customerEmailsDisabled': true,
          'ruralPayments.portalUrl': 'https://rural-payments.example.com'
        })
        const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {})

        await Mutation.sendConfirmEmailAddressEmail(
          null,
          {},
          { dataSources: mockDataSources, defraIdContext }
        )

        expect(infoSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            'https://rural-payments.example.com/validate-email/test%2Buser%40example.com/digitalContactPartyId'
          )
        )
      })

      test('does not log the email verification link when customer emails are enabled', async () => {
        mockConfig({
          'ruralPayments.customerEmailsDisabled': false,
          'ruralPayments.portalUrl': 'https://rural-payments.example.com'
        })
        const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {})

        await Mutation.sendConfirmEmailAddressEmail(
          null,
          {},
          { dataSources: mockDataSources, defraIdContext }
        )

        expect(infoSpy).not.toHaveBeenCalledWith(expect.stringContaining('validate-email'))
      })
    })

    test('does not throw when no audit trail is supplied', async () => {
      await Mutation.sendConfirmEmailAddressEmail(
        null,
        {},
        { dataSources: mockDataSources, defraIdContext }
      )
    })
  })

  describe('updateUnlockCustomer', () => {
    test('unlocks a customer through the GraphQL mutation', async () => {
      mockDataSources.mongoCustomer.findPersonIdByCRN.mockResolvedValue('personId')

      const auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
      const input = { crn: 'crn', reason: 'my reason', note: 'my note' }

      await Mutation.updateUnlockCustomer(
        null,
        { input },
        { dataSources: mockDataSources, auditTrail },
        { path: { key: 'updateUnlockCustomer' } }
      )

      expect(mockDataSources.ruralPaymentsCustomer.unlockPerson).toHaveBeenCalledWith(
        'personId',
        'my reason',
        'my note'
      )
      expect(mockDataSources.mongoCustomer.findPersonIdByCRN).toHaveBeenCalledWith('crn')
    })

    test('throws an error if no reason or note is provided', async () => {
      const auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
      const input = { crn: 'crn' }

      await expect(
        Mutation.updateUnlockCustomer(
          null,
          { input },
          { dataSources: mockDataSources, auditTrail },
          { path: { key: 'updateUnlockCustomer' } }
        )
      ).rejects.toThrow('At least one of reason or note must be provided')
    })

    test('throws an error if empty reason or note is provided', async () => {
      const auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
      const input = { crn: 'crn', note: '', reason: '' }

      await expect(
        Mutation.updateUnlockCustomer(
          null,
          { input },
          { dataSources: mockDataSources, auditTrail },
          { path: { key: 'updateUnlockCustomer' } }
        )
      ).rejects.toThrow('At least one of reason or note must be provided')
    })

    test('throws 404 if the person is not found', async () => {
      mockDataSources.mongoCustomer.findPersonIdByCRN.mockRejectedValue(new Error('Not Found'))
      mockDataSources.ruralPaymentsCustomer.getPersonIdByCRN.mockRejectedValue(
        new Error('Not Found')
      )

      const auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
      const input = { crn: 'crn', reason: 'my reason' }

      await expect(
        Mutation.updateUnlockCustomer(
          null,
          { input },
          { dataSources: mockDataSources, auditTrail },
          { path: { key: 'updateUnlockCustomer' } }
        )
      ).rejects.toThrow('Not Found')
    })

    test('records the personId account and a unlocked person entity', async () => {
      mockDataSources.mongoCustomer.findPersonIdByCRN.mockResolvedValue('personId')

      const auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
      const input = { crn: 'crn', reason: 'my reason', note: 'my note' }
      const info = { path: { key: 'updateUnlockCustomer' } }

      await Mutation.updateUnlockCustomer(
        null,
        { input },
        { dataSources: mockDataSources, auditTrail },
        info
      )

      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'personId', 'personId')
      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'crn', 'crn')
      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
        entity: 'person',
        action: 'unlocked',
        entityid: 'crn'
      })
    })

    test('throws 404 and records undefined personId if the person is not found', async () => {
      const info = { path: { key: 'updateUnlockCustomer' } }
      const input = { crn: 'crn', reason: 'my reason' }
      mockDataSources.mongoCustomer.findPersonIdByCRN.mockRejectedValue(new Error('Not Found'))
      mockDataSources.ruralPaymentsCustomer.getPersonIdByCRN.mockRejectedValue(
        new Error('Not Found')
      )

      const auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }

      await expect(
        Mutation.updateUnlockCustomer(
          null,
          { input },
          { dataSources: mockDataSources, auditTrail },
          { path: { key: 'updateUnlockCustomer' } }
        )
      ).rejects.toThrow('Not Found')

      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'personId', undefined)
      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'crn', 'crn')
      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
        entity: 'person',
        action: 'unlocked',
        entityid: 'crn'
      })
    })
  })

  describe('updateDeactivateCustomer', () => {
    const info = { path: { key: 'updateDeactivateCustomer' } }
    let auditTrail

    beforeEach(() => {
      auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
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
      ['only a reason is given', { reason: 'my reason' }, ['my reason', undefined]],
      ['only a note is given', { note: 'my note' }, [undefined, 'my note']],
      ['the note is only spaces', { reason: 'my reason', note: '  ' }, ['my reason', undefined]],
      ['the reason is empty', { reason: '', note: 'my note' }, [undefined, 'my note']]
    ])('deactivates when %s, sending only what was given', async (_, fields, expected) => {
      // arrange
      mockDataSources.mongoCustomer.findPersonIdByCRN.mockResolvedValue('personId')

      // act
      await deactivate({ crn: 'crn', ...fields })

      // assert
      expect(mockDataSources.ruralPaymentsCustomer.deactivatePerson).toHaveBeenCalledWith(
        'personId',
        ...expected
      )
    })

    test.each([
      ['neither is given', {}],
      ['both are empty', { reason: '', note: '' }],
      ['both are only spaces', { reason: '   ', note: '  ' }]
    ])('refuses without calling upstream when %s', async (_, fields) => {
      // arrange / act
      const error = await deactivate({ crn: 'crn', ...fields }).catch((e) => e)

      // assert
      expect(error.message).toBe('At least one of reason or note must be provided')
      expect(error.extensions.code).toBe('REASON_OR_NOTE_REQUIRED')
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
      await deactivate({ crn: 'crn', reason: '', note: '' }).catch(() => {})

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

  describe('updateCustomerAuthenticationQuestions', () => {
    const info = { path: { key: 'updateCustomerAuthenticationQuestions' } }
    const answers = {
      memorableDate: 'my date',
      memorableEvent: 'my event',
      memorableLocation: 'my location'
    }
    let auditTrail

    beforeEach(() => {
      auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
    })

    const updateAuthenticationQuestions = (input, defraIdContext) =>
      Mutation.updateCustomerAuthenticationQuestions(
        null,
        { input },
        { dataSources: mockDataSources, auditTrail, defraIdContext },
        info
      )

    test('saves the answers for the crn and returns the customer', async () => {
      // arrange
      mockDataSources.mongoCustomer.findPersonIdByCRN.mockResolvedValue('personId')

      // act
      const result = await updateAuthenticationQuestions({ crn: 'crn', ...answers })

      // assert
      expect(
        mockDataSources.ruralPaymentsCustomer.saveAuthenticateAnswersByCRN
      ).toHaveBeenCalledWith('crn', answers)
      expect(result).toEqual({ success: true, customer: { crn: 'crn', personId: 'personId' } })
    })

    test('audits the crn, the personId and an updated authenticate question', async () => {
      // arrange
      mockDataSources.mongoCustomer.findPersonIdByCRN.mockResolvedValue('personId')

      // act
      await updateAuthenticationQuestions({ crn: 'crn', ...answers })

      // assert
      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'crn', 'crn')
      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'personId', 'personId')
      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
        entity: 'authenticate-question',
        action: 'updated',
        entityid: 'crn'
      })
    })

    test('saves the answers when an external user gives the crn in their token', async () => {
      // arrange
      mockDataSources.mongoCustomer.findPersonIdByCRN.mockResolvedValue('personId')
      const defraIdContext = { crn: () => 'crn' }

      // act
      const result = await updateAuthenticationQuestions({ crn: 'crn', ...answers }, defraIdContext)

      // assert
      expect(
        mockDataSources.ruralPaymentsCustomer.saveAuthenticateAnswersByCRN
      ).toHaveBeenCalledWith('crn', answers)
      expect(result).toEqual({ success: true, customer: { crn: 'crn', personId: 'personId' } })
    })

    test('refuses an external user giving a crn other than the one in their token', async () => {
      // arrange
      const defraIdContext = { crn: () => 'own-crn' }

      // act
      const error = await updateAuthenticationQuestions(
        { crn: 'crn', ...answers },
        defraIdContext
      ).catch((e) => e)

      // assert
      expect(error.message).toBe('Defra ID token is not valid for the provided CRN')
      expect(error.extensions.code).toBe('FORBIDDEN')
      expect(error.extensions.http).toEqual({ status: 403 })
      expect(mockDataSources.mongoCustomer.findPersonIdByCRN).not.toHaveBeenCalled()
      expect(
        mockDataSources.ruralPaymentsCustomer.saveAuthenticateAnswersByCRN
      ).not.toHaveBeenCalled()
      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'crn', 'crn')
    })

    test('does not save the answers when the customer is not found', async () => {
      // arrange
      mockDataSources.ruralPaymentsCustomer.getPersonIdByCRN.mockRejectedValue(
        new Error('Not Found')
      )

      // act / assert
      await expect(updateAuthenticationQuestions({ crn: 'crn', ...answers })).rejects.toThrow(
        'Not Found'
      )
      expect(
        mockDataSources.ruralPaymentsCustomer.saveAuthenticateAnswersByCRN
      ).not.toHaveBeenCalled()
      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'crn', 'crn')
    })
  })
})
