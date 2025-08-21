import { jest } from '@jest/globals'
import { Mutation } from '../../../app/graphql/resolvers/customer/mutation.js'

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
        updatePersonDetails: jest.fn()
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
})
