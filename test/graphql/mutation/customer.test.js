import { jest } from '@jest/globals'
import nock from 'nock'
import { config } from '../../../app/config.js'

const mockCustomerCommonModule = {
  retrievePersonIdByCRN: jest.fn().mockResolvedValue('personId')
}

jest.unstable_mockModule(
  '../../../app/graphql/resolvers/customer/common.js',
  () => mockCustomerCommonModule
)

const { makeTestQuery } = await import('../makeTestQuery.js')

beforeEach(() => {
  mockCustomerCommonModule.retrievePersonIdByCRN.mockResolvedValue('personId')
  nock.disableNetConnect()
})

afterEach(() => {
  nock.cleanAll()
  nock.enableNetConnect()
})

function setupNock(update = {}) {
  const kits = nock(config.get('kits.internal.gatewayUrl'))

  // Pre update
  kits
    .post('/person/search', {
      searchFieldType: 'CUSTOMER_REFERENCE',
      primarySearchPhrase: '1234567890',
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

  const person = {
    id: 'personId',
    title: 'currentTitle',
    otherTitle: 'currentOtherTitle',
    firstName: 'currentFirstName',
    middleName: 'currentMiddleName',
    lastName: 'currentLastName',
    dateOfBirth: 1735732800000,
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

  kits.get('/person/personId/summary').reply(200, {
    _data: person
  })

  // Update - nock expects the milliseconds value the resolver now sends
  const updatedPerson = {
    ...person,
    ...update,
    dateOfBirth: update.dateOfBirth || 1735732800000,
    address: {
      ...person.address,
      ...(update?.address || {})
    }
  }

  kits.put('/person/personId', updatedPerson).reply(201)

  kits
    .post('/person/search', {
      searchFieldType: 'CUSTOMER_REFERENCE',
      primarySearchPhrase: '1234567890',
      offset: 0,
      limit: 1
    })
    .reply(200, {
      _data: [{ id: 'personId' }]
    })

  kits.get('/person/personId/summary').reply(200, {
    _data: {
      ...updatedPerson,
      dateOfBirth: updatedPerson.dateOfBirth
    }
  })
}

describe('customer mutations', () => {
  describe('updateLockCustomer', () => {
    test('locks a customer through the GraphQL mutation', async () => {
      nock(config.get('kits.internal.gatewayUrl'))
        .post('/person/personId/lock', {
          reason: 'my reason',
          partyNoteType: 'LockPerson'
        })
        .reply(204)

      nock(config.get('kits.internal.gatewayUrl'))
        .get('/person/personId/summary')
        .reply(200, {
          _data: { id: 'personId', locked: true, customerReferenceNumber: 'crn' }
        })

      const result = await makeTestQuery(`#graphql
        mutation {
          updateLockCustomer(input: { crn: "1234567890", reason: "my reason" }) {
            success
            customer {
              info {
                status {
                  locked
                }
              }
            }
          }
        }
      `)

      expect(result).toEqual({
        data: {
          updateLockCustomer: {
            success: true,
            customer: {
              info: {
                status: {
                  locked: true
                }
              }
            }
          }
        }
      })
    })

    test('throws an error if no reason or note is provided', async () => {
      const result = await makeTestQuery(`#graphql
        mutation {
          updateLockCustomer(input: { crn: "1234567890" }) {
            success
            customer {
              info {
                status {
                  locked
                }
              }
            }
          }
        }
      `)

      expect(result.errors[0].message).toBe('At least one of reason or note must be provided')
    })

    test('throws 404 if the person is not found', async () => {
      nock(config.get('kits.internal.gatewayUrl'))
        .post('/person/personId/lock', {
          reason: 'my reason',
          partyNoteType: 'LockPerson'
        })
        .reply(204)

      nock(config.get('kits.internal.gatewayUrl'))
        .get('/person/personId/summary')
        .reply(404, { message: 'Person not found' })

      const result = await makeTestQuery(`#graphql
        mutation {
          updateLockCustomer(input: { crn: "1234567890", reason: "my reason" }) {
            success
            customer {
              info {
                status {
                  locked
                }
              }
            }
          }
        }
      `)

      expect(result.errors[0].message).toBe('Not Found')
    })
  })

  describe('updateDeactivateCustomer', () => {
    const deactivateMutation = `#graphql
      mutation Deactivate($input: UpdateDeactivateCustomerInput!) {
        updateDeactivateCustomer(input: $input) {
          success
        }
      }
    `
    const validInput = { crn: '1234567890', reason: 'my reason', note: 'my note' }
    let configMockPath

    beforeEach(() => {
      configMockPath = {}
      const originalConfig = { ...config }
      jest
        .spyOn(config, 'get')
        .mockImplementation((path) =>
          configMockPath[path] === undefined ? originalConfig.get(path) : configMockPath[path]
        )
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    const nockDeactivate = (status = 204) =>
      nock(config.get('kits.internal.gatewayUrl'))
        .post('/person/personId/deactivate', {
          reason: 'my reason',
          note: 'my note',
          partyNoteType: 'DeactivatePerson'
        })
        .reply(status)

    test('deactivates the customer in KITS', async () => {
      // arrange
      const kits = nockDeactivate()

      // act
      const result = await makeTestQuery(deactivateMutation, null, true, { input: validInput })

      // assert
      expect(result).toEqual({ data: { updateDeactivateCustomer: { success: true } } })
      expect(kits.isDone()).toBe(true)
    })

    test.each(['reason', 'note'])('refuses a request with no %s', async (field) => {
      // arrange
      const kits = nockDeactivate()
      const input = { ...validInput }
      delete input[field]

      // act
      const result = await makeTestQuery(deactivateMutation, null, true, { input })

      // assert
      expect(result.errors[0].message).toContain(
        `Field "${field}" of required type "String!" was not provided`
      )
      expect(kits.isDone()).toBe(false)
    })

    test('refuses a blank reason with REASON_AND_NOTE_REQUIRED', async () => {
      // arrange
      const kits = nockDeactivate()

      // act
      const result = await makeTestQuery(deactivateMutation, null, true, {
        input: { ...validInput, reason: '  ' }
      })

      // assert
      expect(result.errors[0].message).toBe('Both reason and note must be provided')
      expect(result.errors[0].extensions.code).toBe('REASON_AND_NOTE_REQUIRED')
      expect(kits.isDone()).toBe(false)
    })

    test.each(['reason', 'note'])('refuses a %s longer than 100 characters', async (field) => {
      // arrange
      const kits = nockDeactivate()

      // act
      const result = await makeTestQuery(deactivateMutation, null, true, {
        input: { ...validInput, [field]: 'x'.repeat(101) }
      })

      // assert
      expect(result.errors[0].message).toBe(
        `variable 'input.${field}' must match pattern ^.{0,100}$`
      )
      expect(kits.isDone()).toBe(false)
    })

    test('returns Not Found when KITS cannot find the person', async () => {
      // arrange
      nockDeactivate(404)

      // act
      const result = await makeTestQuery(deactivateMutation, null, true, { input: validInput })

      // assert
      expect(result.errors[0].message).toBe('Not Found')
      expect(result.data.updateDeactivateCustomer).toBeNull()
    })

    test('allows callers in the SINGLE_FRONT_DOOR group', async () => {
      // arrange
      configMockPath['auth.disabled'] = false
      const kits = nockDeactivate()

      // act
      const result = await makeTestQuery(deactivateMutation, null, false, { input: validInput }, [
        config.get('auth.groups.SINGLE_FRONT_DOOR')
      ])

      // assert
      expect(result.errors).toBeUndefined()
      expect(kits.isDone()).toBe(true)
    })

    test('blocks callers outside the SINGLE_FRONT_DOOR group', async () => {
      // arrange
      configMockPath['auth.disabled'] = false
      const kits = nockDeactivate()

      // act
      const result = await makeTestQuery(deactivateMutation, null, false, { input: validInput }, [
        config.get('auth.groups.CONSOLIDATED_VIEW')
      ])

      // assert
      expect(result.errors[0].message).toBe(
        'Authorization failed, you are not in the correct AD groups'
      )
      expect(kits.isDone()).toBe(false)
    })

    test('blocks service accounts', async () => {
      // arrange
      configMockPath['auth.disabled'] = false
      const kits = nockDeactivate()

      // act
      const result = await makeTestQuery(
        deactivateMutation,
        { 'service-account': 'service@defra.gov.uk' },
        false,
        { input: validInput },
        [config.get('auth.groups.SINGLE_FRONT_DOOR')]
      )

      // assert
      expect(result.errors[0].message).toBe(
        'Authorization failed, this field is not available to service accounts'
      )
      expect(kits.isDone()).toBe(false)
    })
  })

  test('updateCustomerAddress', async () => {
    setupNock({
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
        doubleDependentLocality: 'newDoubleDependentLocality'
      }
    })

    const result = await makeTestQuery(`#graphql
      mutation {
        updateCustomerAddress(
          input: {
            crn: "1234567890"
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
            info {
              address {
                pafOrganisationName
                line1
                line2
                line3
                line4
                line5
                buildingNumberRange
                buildingName
                flatName
                street
                city
                county
                postalCode
                country
                uprn
                dependentLocality
                doubleDependentLocality
              }
            }
          }
        }
      }
    `)

    expect(result).toEqual({
      data: {
        updateCustomerAddress: {
          success: true,
          customer: {
            info: {
              address: {
                pafOrganisationName: 'newPafOrganisationName',
                line1: 'newLine1',
                line2: 'newLine2',
                line3: 'newLine3',
                line4: 'newLine4',
                line5: 'newLine5',
                buildingNumberRange: 'newBuildingNumberRange',
                buildingName: 'newBuildingName',
                flatName: 'newFlatName',
                street: 'newStreet',
                city: 'newCity',
                county: 'newCounty',
                postalCode: 'newPostalCode',
                country: 'newCountry',
                uprn: 'newUprn',
                dependentLocality: 'newDependentLocality',
                doubleDependentLocality: 'newDoubleDependentLocality'
              }
            }
          }
        }
      }
    })
  })

  test('updateCustomerDateOfBirth', async () => {
    setupNock({
      dateOfBirth: 1735689600000
    })

    const result = await makeTestQuery(`#graphql
      mutation {
        updateCustomerDateOfBirth(input: { crn: "1234567890", dateOfBirth: "2025-01-01" }) {
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
              dateOfBirth: '2025-01-01'
            }
          }
        }
      }
    })
  })

  test('updateCustomerEmail', async () => {
    setupNock({
      email: 'newEmail'
    })

    nock(config.get('kits.internal.gatewayUrl'))
      .get('/person/newEmail/validateEmail')
      .reply(200, { _data: { emailDuplicated: false } })

    const result = await makeTestQuery(`#graphql
      mutation {
        updateCustomerEmail(input: { crn: "1234567890", email: { address: "newEmail" } }) {
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
      title: 'newTitle',
      otherTitle: 'newOtherTitle',
      firstName: 'newFirst',
      middleName: 'newMiddle',
      lastName: 'newLast'
    })

    const result = await makeTestQuery(`#graphql
      mutation {
        updateCustomerName(
          input: {
            crn: "1234567890"
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
      landline: 'newLandline',
      mobile: 'newMobile'
    })

    const result = await makeTestQuery(`#graphql
      mutation {
        updateCustomerPhone(
          input: { crn: "1234567890", phone: { landline: "newLandline", mobile: "newMobile" } }
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

  test('updateCustomerDoNotContact', async () => {
    setupNock({
      doNotContact: true
    })

    const result = await makeTestQuery(`#graphql
      mutation {
        updateCustomerDoNotContact(
          input: { crn: "1234567890", doNotContact: true }
        ) {
          success
          customer {
            info {
              doNotContact
            }
          }
        }
      }
    `)

    expect(result).toEqual({
      data: {
        updateCustomerDoNotContact: {
          success: true,
          customer: { info: { doNotContact: true } }
        }
      }
    })
  })
})
