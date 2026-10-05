import nock from 'nock'
import { config } from '../../../app/config.js'
import { db } from '../../../app/mongo.js'
import { transformBusinessDetailsToOrgDetailsCreate } from '../../../app/transformers/rural-payments/business.js'
import {
  mockBusinessTypeReferenceData,
  mockLegalStatusReferenceData,
  mockPersonSearch
} from '../helpers.js'
import { makeTestQuery } from '../makeTestQuery.js'
import { waitFor } from '../../test-helpers/wait-for.js'

const v1 = nock(config.get('kits.internal.gatewayUrl'))

const setupNock = () => {
  nock.disableNetConnect()

  mockLegalStatusReferenceData(v1)
  mockBusinessTypeReferenceData(v1)
  mockPersonSearch(v1)

  v1.post('/organisation/create/personId').reply(200, {
    _data: orgDetails
  })
}

const input = {
  crn: '1234567890',
  name: 'Acme Farms Ltd',
  vat: '123456789',
  traderNumber: 'TR12345',
  vendorNumber: 'VN67890',
  address: {
    withoutUprn: {
      line1: '1 Farm Lane',
      line2: 'Rural Area',
      city: 'Farmville',
      postalCode: 'FV1 2AB',
      country: 'UK'
    }
  },
  correspondenceAddress: {
    withoutUprn: {
      line1: 'PO Box 123',
      city: 'Farmville',
      postalCode: 'FV1 2AB',
      country: 'UK'
    }
  },
  email: {
    address: 'info@acmefarms.co.uk'
  },
  correspondenceEmail: {
    address: 'correspondence@acmefarms.co.uk'
  },
  phone: {
    landline: '+441234567890',
    mobile: '+441234567891'
  },
  correspondencePhone: {
    landline: '+441234567892'
  },
  legalStatusCode: 102111,
  typeCode: 2,
  registrationNumbers: {
    companiesHouse: '12345678',
    charityCommission: '87654321'
  },
  landConfirmed: true,
  dateStartedFarming: new Date('2021-05-27T12:46:17.305Z')
}

const orgDetails = { id: 'orgId', sbi: 'sbi', ...transformBusinessDetailsToOrgDetailsCreate(input) }

const query = `
mutation CreateBusiness($input: CreateBusinessInput!) {
  createBusiness(input: $input) {
    success
    business {
      info {
        address {
          buildingName
          buildingNumberRange
          city
          country
          pafOrganisationName
          line1
          line2
          line3
          line4
          line5
          flatName
          street
          county
          postalCode
          uprn
          dependentLocality
          doubleDependentLocality
          typeId
        }
        correspondenceAddress {
          line1
          line2
          line3
          line4
          pafOrganisationName
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
          typeId
        }
        name
        reference
        vat
        traderNumber
        vendorNumber
        isCorrespondenceAsBusinessAddress
        email {
          address
          validated
        }
        correspondenceEmail {
          address
          validated
        }
        phone {
          mobile
          landline
        }
        correspondencePhone {
          mobile
          landline
        }
        legalStatus {
          code
          type
        }
        type {
          code
          type
        }
        registrationNumbers {
          companiesHouse
          charityCommission
        }
        landConfirmed
        dateStartedFarming
      }
    }
  }
}
`

// retrievePersonIdByCRN fires a MongoDB insert without awaiting it to avoid slowing down the
// request. In tests this means a potential race condition between the insert and the database
// cleanup. For safety, we should wait for the insert complete  (allowing the db to be torn down in
// the afterEach)
const waitForPersonIdToBeCachedInMongo = async () => {
  await waitFor(async () => {
    const cached = await db.collection('customers').findOne({ _id: '1234567890' })
    expect(cached?.personId).toBe('personId')
  })
}

//  Nock is setup separately in each test to ensure the order and number of requests is as expected
describe('business', () => {
  afterEach(async () => {
    nock.cleanAll()
    nock.enableNetConnect()
    await db.dropDatabase()
  })

  beforeEach(setupNock)

  test('create a business - withoutUprn', async () => {
    const result = await makeTestQuery(query, null, true, { input }, [], false)

    expect(nock.isDone()).toBe(true)

    await waitForPersonIdToBeCachedInMongo()

    expect(result).toEqual({
      data: {
        createBusiness: {
          success: true,
          business: {
            info: {
              address: {
                buildingName: null,
                buildingNumberRange: null,
                city: 'Farmville',
                country: 'UK',
                pafOrganisationName: null,
                line1: '1 Farm Lane',
                line2: 'Rural Area',
                line3: null,
                line4: null,
                line5: null,
                flatName: null,
                street: null,
                county: null,
                postalCode: 'FV1 2AB',
                uprn: null,
                dependentLocality: null,
                doubleDependentLocality: null,
                typeId: null
              },
              correspondenceAddress: {
                line1: 'PO Box 123',
                line2: null,
                line3: null,
                line4: null,
                pafOrganisationName: null,
                line5: null,
                buildingNumberRange: null,
                buildingName: null,
                flatName: null,
                street: null,
                city: 'Farmville',
                county: null,
                postalCode: 'FV1 2AB',
                country: 'UK',
                uprn: null,
                dependentLocality: null,
                doubleDependentLocality: null,
                typeId: null
              },
              name: 'Acme Farms Ltd',
              reference: null,
              vat: '123456789',
              traderNumber: 'TR12345',
              vendorNumber: 'VN67890',
              isCorrespondenceAsBusinessAddress: false,
              email: {
                address: 'info@acmefarms.co.uk',
                validated: null
              },
              correspondenceEmail: {
                address: 'correspondence@acmefarms.co.uk',
                validated: false
              },
              phone: {
                mobile: '+441234567891',
                landline: '+441234567890'
              },
              correspondencePhone: {
                mobile: null,
                landline: '+441234567892'
              },
              legalStatus: {
                code: 102111,
                type: null
              },
              type: {
                code: 2,
                type: null
              },
              registrationNumbers: {
                companiesHouse: '12345678',
                charityCommission: '87654321'
              },
              landConfirmed: true,
              dateStartedFarming: new Date('2021-05-27T12:46:17.305Z')
            }
          }
        }
      }
    })
  })

  test('create a business - withUprn', async () => {
    const inputWithUprn = {
      ...input,
      address: {
        withUprn: {
          ...input.address.withoutUprn,
          uprn: '123456789012'
        }
      },
      correspondenceAddress: {
        withUprn: { ...input.correspondenceAddress.withoutUprn, uprn: '123456789012' }
      }
    }
    const result = await makeTestQuery(query, null, true, { input: inputWithUprn }, [], false)

    expect(result).toEqual({
      data: {
        createBusiness: {
          success: true,
          business: {
            info: {
              address: {
                buildingName: null,
                buildingNumberRange: null,
                city: 'Farmville',
                country: 'UK',
                pafOrganisationName: null,
                line1: '1 Farm Lane',
                line2: 'Rural Area',
                line3: null,
                line4: null,
                line5: null,
                flatName: null,
                street: null,
                county: null,
                postalCode: 'FV1 2AB',
                uprn: null,
                dependentLocality: null,
                doubleDependentLocality: null,
                typeId: null
              },
              correspondenceAddress: {
                line1: 'PO Box 123',
                line2: null,
                line3: null,
                line4: null,
                pafOrganisationName: null,
                line5: null,
                buildingNumberRange: null,
                buildingName: null,
                flatName: null,
                street: null,
                city: 'Farmville',
                county: null,
                postalCode: 'FV1 2AB',
                country: 'UK',
                uprn: null,
                dependentLocality: null,
                doubleDependentLocality: null,
                typeId: null
              },
              name: 'Acme Farms Ltd',
              reference: null,
              vat: '123456789',
              traderNumber: 'TR12345',
              vendorNumber: 'VN67890',
              isCorrespondenceAsBusinessAddress: false,
              email: {
                address: 'info@acmefarms.co.uk',
                validated: null
              },
              correspondenceEmail: {
                address: 'correspondence@acmefarms.co.uk',
                validated: false
              },
              phone: {
                mobile: '+441234567891',
                landline: '+441234567890'
              },
              correspondencePhone: {
                mobile: null,
                landline: '+441234567892'
              },
              legalStatus: {
                code: 102111,
                type: null
              },
              type: {
                code: 2,
                type: null
              },
              registrationNumbers: {
                companiesHouse: '12345678',
                charityCommission: '87654321'
              },
              landConfirmed: true,
              dateStartedFarming: new Date('2021-05-27T12:46:17.305Z')
            }
          }
        }
      }
    })
    expect(nock.pendingMocks()).toEqual([])
  })

  test('create a business - rejects missing address', async () => {
    const { address: _, ...inputWithoutAddress } = input
    const result = await makeTestQuery(query, null, true, { input: inputWithoutAddress }, [], false)

    expect(result.errors[0].message).toContain(
      'Field "address" of required type "ValidAddressInput!" was not provided.'
    )
    expect(result.data).toBeUndefined()
    expect(v1.isDone()).toBe(false)
  })

  test('create a business - rejects missing phone', async () => {
    const { phone: _, ...inputWithoutPhone } = input
    const result = await makeTestQuery(query, null, true, { input: inputWithoutPhone }, [], false)

    expect(result.errors[0].message).toContain(
      'Field "phone" of required type "PhoneInput!" was not provided.'
    )
    expect(result.data).toBeUndefined()
    expect(v1.isDone()).toBe(false)
  })

  test.each([
    ['empty', {}],
    ['null numbers', { mobile: null, landline: null }],
    ['blank numbers', { mobile: ' ', landline: '' }]
  ])('create a business - rejects phone with %s', async (_, phone) => {
    const result = await makeTestQuery(query, null, true, { input: { ...input, phone } }, [], false)

    expect(result.errors[0].message).toEqual(
      'phone must include at least one of mobile or landline'
    )
    expect(result.errors[0].extensions.code).toEqual('BAD_USER_INPUT')
    expect(result.data.createBusiness).toBeNull()
    // Rejected before the business is created upstream
    expect(nock.pendingMocks()).toContainEqual(
      expect.stringContaining('/organisation/create/personId')
    )
  })

  test('create a business - rejects unknown legal status code', async () => {
    const result = await makeTestQuery(
      query,
      null,
      true,
      { input: { ...input, legalStatusCode: 102 } },
      [],
      false
    )

    expect(result.errors[0].message).toEqual('Invalid legalStatusCode: 102')
    expect(result.errors[0].extensions.code).toEqual('BAD_USER_INPUT')
    expect(result.data.createBusiness).toBeNull()
    // Rejected before the business is created upstream
    expect(nock.pendingMocks()).toContainEqual(
      expect.stringContaining('/organisation/create/personId')
    )
  })

  test('create a business - rejects unknown type code', async () => {
    const result = await makeTestQuery(
      query,
      null,
      true,
      { input: { ...input, typeCode: 123 } },
      [],
      false
    )

    expect(result.errors[0].message).toEqual('Invalid typeCode: 123')
    expect(result.errors[0].extensions.code).toEqual('BAD_USER_INPUT')
    expect(result.data.createBusiness).toBeNull()
    // Rejected before the business is created upstream
    expect(nock.pendingMocks()).toContainEqual(
      expect.stringContaining('/organisation/create/personId')
    )
  })

  test('create a business - rejects missing name', async () => {
    const { name: _, ...inputWithoutName } = input
    const result = await makeTestQuery(query, null, true, { input: inputWithoutName }, [], false)

    expect(result.errors[0].message).toContain(
      'Field "name" of required type "String!" was not provided.'
    )
    expect(result.data).toBeUndefined()
    expect(v1.isDone()).toBe(false)
  })

  test('create a business - rejects name longer than 160 characters', async () => {
    const result = await makeTestQuery(
      query,
      null,
      true,
      { input: { ...input, name: 'a'.repeat(161) } },
      [],
      false
    )

    expect(result.errors[0].message).toEqual("variable 'input.name' must match pattern ^.{0,160}$")
    expect(result.errors[0].extensions.code).toEqual('BAD_USER_INPUT')
    expect(result.data.createBusiness).toBeNull()
    expect(nock.pendingMocks()).toContainEqual(
      expect.stringContaining('/organisation/create/personId')
    )
  })

  test('create a business - accepts name of exactly 160 characters', async () => {
    const result = await makeTestQuery(
      query,
      null,
      true,
      { input: { ...input, name: 'a'.repeat(160) } },
      [],
      false
    )

    expect(result.errors).toBeUndefined()
    expect(result.data.createBusiness.success).toBe(true)
  })

  const addressFieldsLimitedTo240 = [
    'pafOrganisationName',
    'dependentLocality',
    'doubleDependentLocality'
  ]

  test.each(addressFieldsLimitedTo240)(
    'create a business - rejects address %s longer than 240 characters',
    async (field) => {
      const address = {
        withoutUprn: { ...input.address.withoutUprn, [field]: 'a'.repeat(241) }
      }
      const result = await makeTestQuery(
        query,
        null,
        true,
        { input: { ...input, address } },
        [],
        false
      )

      expect(result.errors[0].message).toEqual(
        `variable 'input.address.withoutUprn.${field}' must match pattern ^.{0,240}$`
      )
      expect(result.errors[0].extensions.code).toEqual('BAD_USER_INPUT')
      expect(result.data.createBusiness).toBeNull()
      expect(nock.pendingMocks()).toContainEqual(
        expect.stringContaining('/organisation/create/personId')
      )
    }
  )

  test.each(addressFieldsLimitedTo240)(
    'create a business - accepts address %s of exactly 240 characters',
    async (field) => {
      const address = {
        withoutUprn: { ...input.address.withoutUprn, [field]: 'a'.repeat(240) }
      }
      const result = await makeTestQuery(
        query,
        null,
        true,
        { input: { ...input, address } },
        [],
        false
      )

      expect(result.errors).toBeUndefined()
      expect(result.data.createBusiness.success).toBe(true)
    }
  )

  test('create a business - rejects email address longer than 254 characters', async () => {
    const result = await makeTestQuery(
      query,
      null,
      true,
      { input: { ...input, email: { address: `${'a'.repeat(243)}@example.com` } } },
      [],
      false
    )

    expect(result.errors[0].message).toEqual(
      "variable 'input.email.address' must match pattern ^.{0,254}$"
    )
    expect(result.errors[0].extensions.code).toEqual('BAD_USER_INPUT')
    expect(result.data.createBusiness).toBeNull()
    expect(nock.pendingMocks()).toContainEqual(
      expect.stringContaining('/organisation/create/personId')
    )
  })

  test.each(['mobile', 'landline'])(
    'create a business - rejects phone %s longer than 50 characters',
    async (field) => {
      const result = await makeTestQuery(
        query,
        null,
        true,
        { input: { ...input, phone: { ...input.phone, [field]: `+44${'1'.repeat(48)}` } } },
        [],
        false
      )

      expect(result.errors[0].message).toEqual(
        `variable 'input.phone.${field}' must match pattern ^.{0,50}$`
      )
      expect(result.errors[0].extensions.code).toEqual('BAD_USER_INPUT')
      expect(result.data.createBusiness).toBeNull()
      expect(nock.pendingMocks()).toContainEqual(
        expect.stringContaining('/organisation/create/personId')
      )
    }
  )

  test('create a business - rejects uprn longer than 12 characters', async () => {
    const address = { withUprn: { ...input.address.withoutUprn, uprn: '1234567890123' } }
    const result = await makeTestQuery(
      query,
      null,
      true,
      { input: { ...input, address } },
      [],
      false
    )

    expect(result.errors[0].message).toEqual(
      "variable 'input.address.withUprn.uprn' must match pattern ^.{0,12}$"
    )
    expect(result.errors[0].extensions.code).toEqual('BAD_USER_INPUT')
    expect(result.data.createBusiness).toBeNull()
    expect(nock.pendingMocks()).toContainEqual(
      expect.stringContaining('/organisation/create/personId')
    )
  })

  test.each([
    ['line1', 240],
    ['line2', 240],
    ['line3', 240],
    ['line4', 240],
    ['line5', 240],
    ['buildingNumberRange', 240],
    ['buildingName', 240],
    ['flatName', 240],
    ['street', 240],
    ['city', 60],
    ['county', 60],
    ['postalCode', 8],
    ['country', 100]
  ])(
    'create a business - rejects address %s longer than %i characters',
    async (field, maxLength) => {
      const address = {
        withoutUprn: { ...input.address.withoutUprn, [field]: 'a'.repeat(maxLength + 1) }
      }
      const result = await makeTestQuery(
        query,
        null,
        true,
        { input: { ...input, address } },
        [],
        false
      )

      expect(result.errors[0].message).toEqual(
        `variable 'input.address.withoutUprn.${field}' must match pattern ^.{0,${maxLength}}$`
      )
      expect(result.errors[0].extensions.code).toEqual('BAD_USER_INPUT')
      expect(result.data.createBusiness).toBeNull()
      expect(nock.pendingMocks()).toContainEqual(
        expect.stringContaining('/organisation/create/personId')
      )
    }
  )
})
