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
      ruralPaymentsCustomer: {
        getPersonIdByCRN: jest.fn(),
        getPersonByPersonId: jest.fn(),
        updatePersonDetails: jest.fn(),
        validateEmail: jest.fn(),
        confirmEmail: jest.fn(),
        saveEmailValidation: jest.fn(),
        sendVerificationEmail: jest.fn()
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

  describe('sendConfirmEmailAddressEmail', () => {
    const input = { crn: 'crn' }

    beforeEach(() => {
      mockDataSources.ruralPaymentsCustomer.getPersonIdByCRN.mockResolvedValue('currentId')
      mockDataSources.ruralPaymentsCustomer.getPersonByPersonId.mockResolvedValue(mockPerson)
      mockDataSources.ruralPaymentsCustomer.confirmEmail.mockResolvedValue({
        id: 'digitalContactPartyId'
      })
    })

    test('confirms the email to obtain the digitalContactPartyId, then sends the verification email', async () => {
      await Mutation.sendConfirmEmailAddressEmail(null, { input }, { dataSources: mockDataSources })

      expect(mockDataSources.ruralPaymentsCustomer.confirmEmail).toHaveBeenCalledWith(
        'currentId',
        'currentEmail'
      )
      expect(mockDataSources.ruralPaymentsCustomer.sendVerificationEmail).toHaveBeenCalledWith(
        'digitalContactPartyId'
      )
    })

    test('saves an email validation record before sending the verification email', async () => {
      await Mutation.sendConfirmEmailAddressEmail(null, { input }, { dataSources: mockDataSources })

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

    test('returns success and the customer personId', async () => {
      const result = await Mutation.sendConfirmEmailAddressEmail(
        null,
        { input },
        { dataSources: mockDataSources }
      )

      expect(result).toEqual({
        success: true,
        customer: { personId: 'currentId' }
      })
    })

    test('throws NotFound and does not attempt to send an email when the customer has no email address', async () => {
      mockDataSources.ruralPaymentsCustomer.getPersonByPersonId.mockResolvedValue({
        ...mockPerson,
        email: null
      })

      await expect(
        Mutation.sendConfirmEmailAddressEmail(null, { input }, { dataSources: mockDataSources })
      ).rejects.toMatchObject({
        message: 'Customer has no email address',
        extensions: { code: 'NOT FOUND', http: { status: 404 } }
      })

      expect(mockDataSources.ruralPaymentsCustomer.confirmEmail).not.toHaveBeenCalled()
      expect(mockDataSources.ruralPaymentsCustomer.saveEmailValidation).not.toHaveBeenCalled()
      expect(mockDataSources.ruralPaymentsCustomer.sendVerificationEmail).not.toHaveBeenCalled()
    })

    test('records the personId/crn accounts and an entity for the audit trail', async () => {
      const auditTrail = { recordAccount: jest.fn(), recordEntity: jest.fn() }
      const info = {
        path: { key: 'sendConfirmEmailAddressEmail', typename: 'Mutation', prev: undefined }
      }

      await Mutation.sendConfirmEmailAddressEmail(
        null,
        { input },
        { dataSources: mockDataSources, auditTrail },
        info
      )

      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'crn', 'crn')
      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'personId', 'currentId')
      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
        entity: 'person',
        action: 'sendConfirmEmailAddressEmail',
        entityid: 'crn'
      })
    })

    test('does not throw when no audit trail is supplied', async () => {
      await Mutation.sendConfirmEmailAddressEmail(null, { input }, { dataSources: mockDataSources })
    })
  })
})
