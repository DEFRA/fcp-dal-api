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
        validateEmail: jest.fn()
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

      test('should not update the customer and should return emailDuplicated when the email is a duplicate', async () => {
        const input = { crn: 'crn', email: { address: 'new@example.com' } }

        mockDataSources.ruralPaymentsCustomer.validateEmail.mockResolvedValue({
          emailDuplicated: true
        })

        const result = await Mutation[mutationName](
          null,
          { input },
          { dataSources: mockDataSources }
        )

        expect(result).toEqual({
          success: false,
          emailDuplicated: true
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
})
