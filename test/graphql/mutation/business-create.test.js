import nock from 'nock'
import { config } from '../../../app/config.js'
import { transformBusinessDetailsToOrgDetailsCreate } from '../../../app/transformers/rural-payments/business.js'
import { mockPersonSearch } from '../helpers.js'
import { makeTestQuery } from '../makeTestQuery.js'

const v1 = nock(config.get('kits.internal.gatewayUrl'))

const setupNock = () => {
  nock.disableNetConnect()

  mockPersonSearch(v1)

  v1.post('/organisation/create/personId').reply(200, {
    _data: orgDetails
  })
}

const input = {
  crn: 'crn',
  name: 'Acme Farms Ltd',
  vat: 'GB123456789',
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
  legalStatusCode: 1,
  typeCode: 2,
  registrationNumbers: {
    companiesHouse: '12345678',
    charityCommission: '87654321'
  },
  landConfirmed: true,
  dateStartedFarming: new Date('2021-05-27T12:46:17.305Z')
}

const orgDetails = transformBusinessDetailsToOrgDetailsCreate(input)

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

//  Nock is setup separately in each test to ensure the order and number of requests is as expected
describe('business', () => {
  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  beforeEach(setupNock)

  test('create a business - withoutUprn', async () => {
    const result = await makeTestQuery(query, true, { input })

    expect(nock.isDone()).toBe(true)

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
              vat: 'GB123456789',
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
                code: 1,
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
    const result = await makeTestQuery(query, true, { input: inputWithUprn })

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
              vat: 'GB123456789',
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
                code: 1,
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
    expect(nock.isDone()).toBe(true)
  })
})
