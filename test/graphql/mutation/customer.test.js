import nock from 'nock'
import { config } from '../../../app/config.js'
import { makeTestQuery } from '../makeTestQuery.js'

beforeEach(() => {
  nock.disableNetConnect()
})

afterEach(() => {
  nock.cleanAll()
  nock.enableNetConnect()
})

function setupNock(putRequestBody = {}) {
  const kits = nock(config.get('kits.internal.gatewayUrl'))

  // Pre update
  kits
    .post('/person/search', {
      searchFieldType: 'CUSTOMER_REFERENCE',
      primarySearchPhrase: 'crn',
      offset: 0,
      limit: 1
    })
    .reply(200, {
      _data: [
        {
          id: 'personId'
        }
      ]
    })

  kits.get('/person/personId/summary').reply(200, {
    _data: {
      id: 'personId',
      title: 'currentTitle',
      otherTitle: 'currentOtherTitle',
      firstName: 'currentFirstName',
      middleName: 'currentMiddleName',
      lastName: 'currentLastName',
      dateOfBirth: 'currentDateOfBirth',
      landline: 'currentLandline',
      mobile: 'currentMobile',
      email: 'currentEmail',
      doNotContact: 'currentDoNotContact',
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
  })

  // Update
  kits.put('/person/personId', putRequestBody).reply(201)

  // Post update
  kits
    .post('/person/search', {
      searchFieldType: 'CUSTOMER_REFERENCE',
      primarySearchPhrase: 'crn',
      offset: 0,
      limit: 1
    })
    .reply(200, {
      _data: [
        {
          id: 'personId'
        }
      ]
    })

  kits.get('/person/personId/summary').reply(200, {
    _data: {
      id: 'personId',
      ...putRequestBody
    }
  })
}

describe('customer mutations', () => {
  test('updateCustomerAddress', async () => {
    setupNock({
      id: 'personId',
      title: 'currentTitle',
      otherTitle: 'currentOtherTitle',
      firstName: 'currentFirstName',
      middleName: 'currentMiddleName',
      lastName: 'currentLastName',
      dateOfBirth: 'currentDateOfBirth',
      landline: 'currentLandline',
      mobile: 'currentMobile',
      email: 'currentEmail',
      doNotContact: 'currentDoNotContact',
      address: {
        address1: 'newLine1',
        address2: 'newLine2',
        address3: 'newLine3',
        address4: 'newLine4',
        address5: 'newLine5',
        pafOrganisationName: 'newPafOrganisationName',
        flatName: 'newFlatName',
        buildingNumberRange: 'newBuildingNumberRange',
        buildingName: 'newBuildingName',
        street: 'newStreet',
        city: 'newCity',
        county: 'newCounty',
        postalCode: 'newPostalCode',
        country: 'newCountry',
        uprn: 'newUprn',
        dependentLocality: 'newDependentLocality',
        doubleDependentLocality: 'newDoubleDependentLocality',
        addressTypeId: 'currentAddressTypeId'
      }
    })

    const result = await makeTestQuery(`#graphql
      mutation {
        updateCustomerAddress(
          input: {
            crn: "crn"
            address: {
              buildingName: "newBuildingName"
              buildingNumberRange: "newBuildingNumberRange"
              city: "newCity"
              country: "newCountry"
              county: "newCounty"
              dependentLocality: "newDependentLocality"
              doubleDependentLocality: "newDoubleDependentLocality"
              flatName: "newFlatName"
              line1: "newLine1"
              line2: "newLine2"
              line3: "newLine3"
              line4: "newLine4"
              line5: "newLine5"
              pafOrganisationName: "newPafOrganisationName"
              postalCode: "newPostalCode"
              street: "newStreet"
              uprn: "newUprn"
            }
          }
        ) {
          success
          customer {
            personId
          }
        }
      }
    `)

    expect(result).toEqual({
      data: {
        updateCustomerAddress: {
          success: true,
          customer: {
            personId: 'personId'
          }
        }
      }
    })
  })

  test('updateCustomerDateOfBirth', async () => {
    setupNock({
      id: 'personId',
      title: 'currentTitle',
      otherTitle: 'currentOtherTitle',
      firstName: 'currentFirstName',
      middleName: 'currentMiddleName',
      lastName: 'currentLastName',
      dateOfBirth: 1,
      landline: 'currentLandline',
      mobile: 'currentMobile',
      email: 'currentEmail',
      doNotContact: 'currentDoNotContact',
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
    })

    const result = await makeTestQuery(`#graphql
      mutation {
        updateCustomerDateOfBirth(input: { crn: "crn", dateOfBirth: 1 }) {
          customer {
            info {
              dateOfBirth
            }
          }
          success
        }
      }
    `)

    expect(result).toEqual({
      data: {
        updateCustomerDateOfBirth: {
          success: true,
          customer: {
            info: {
              dateOfBirth: '1970-01-01T00:00:00.001Z'
            }
          }
        }
      }
    })
  })

  test('updateCustomerEmail', async () => {
    setupNock({
      id: 'personId',
      title: 'currentTitle',
      otherTitle: 'currentOtherTitle',
      firstName: 'currentFirstName',
      middleName: 'currentMiddleName',
      lastName: 'currentLastName',
      dateOfBirth: 'currentDateOfBirth',
      landline: 'currentLandline',
      mobile: 'currentMobile',
      email: 'newEmail',
      doNotContact: 'currentDoNotContact',
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
    })

    const result = await makeTestQuery(`#graphql
      mutation {
        updateCustomerEmail(input: { crn: "crn", email: { address: "newEmail" } }) {
          success
          customer {
            info {
              email {
                address
              }
            }
          }
        }
      }
    `)

    expect(result).toEqual({
      data: {
        updateCustomerEmail: {
          success: true,
          customer: {
            info: {
              email: {
                address: 'newEmail'
              }
            }
          }
        }
      }
    })
  })

  test('updateCustomerName', async () => {
    setupNock({
      id: 'personId',
      title: 'newTitle',
      otherTitle: 'newOtherTitle',
      firstName: 'newFirst',
      middleName: 'newMiddle',
      lastName: 'newLast',
      dateOfBirth: 'currentDateOfBirth',
      landline: 'currentLandline',
      mobile: 'currentMobile',
      email: 'currentEmail',
      doNotContact: 'currentDoNotContact',
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
    })

    const result = await makeTestQuery(`#graphql
      mutation {
        updateCustomerName(
          input: {
            crn: "crn"
            first: "newFirst"
            last: "newLast"
            middle: "newMiddle"
            otherTitle: "newOtherTitle"
            title: "newTitle"
          }
        ) {
          success
          customer {
            info {
              name {
                title
                otherTitle
                first
                middle
                last
              }
            }
          }
        }
      }
    `)

    expect(result).toEqual({
      data: {
        updateCustomerName: {
          success: true,
          customer: {
            info: {
              name: {
                title: 'newTitle',
                otherTitle: 'newOtherTitle',
                first: 'newFirst',
                middle: 'newMiddle',
                last: 'newLast'
              }
            }
          }
        }
      }
    })
  })

  test('updateCustomerPhone', async () => {
    setupNock({
      id: 'personId',
      title: 'currentTitle',
      otherTitle: 'currentOtherTitle',
      firstName: 'currentFirstName',
      middleName: 'currentMiddleName',
      lastName: 'currentLastName',
      dateOfBirth: 'currentDateOfBirth',
      landline: 'newLandline',
      mobile: 'newMobile',
      email: 'currentEmail',
      doNotContact: 'currentDoNotContact',
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
    })

    const result = await makeTestQuery(`#graphql
      mutation {
        updateCustomerPhone(
          input: { crn: "crn", phone: { landline: "newLandline", mobile: "newMobile" } }
        ) {
          success
          customer {
            info {
              phone {
                mobile
                landline
              }
            }
          }
        }
      }
    `)

    expect(result).toEqual({
      data: {
        updateCustomerPhone: {
          success: true,
          customer: { info: { phone: { mobile: 'newMobile', landline: 'newLandline' } } }
        }
      }
    })
  })
})
