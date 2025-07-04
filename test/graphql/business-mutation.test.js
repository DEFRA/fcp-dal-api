config.set('auth.disabled', false)
import nock from 'nock'
import { config } from '../../app/config.js'
import { makeTestQuery } from './makeTestQuery.js'

const businessDetailsUpdatePayload = {
  name: 'HADLEY FARMS LTD 2',
  address: {
    pafOrganisationName: 'pafOrganisationName',
    line1: 'line1',
    line2: 'line2',
    line3: 'line3',
    line4: 'line4',
    line5: 'line5',
    buildingNumberRange: 'buildingNumberRange',
    buildingName: 'COLSHAW HALL',
    flatName: null,
    street: 'street',
    city: 'BRAINTREE',
    county: null,
    postalCode: '12312312',
    country: 'United Kingdom',
    uprn: '123123123',
    dependentLocality: 'HIGH HAWSKER',
    doubleDependentLocality: null
  },
  correspondenceAddress: {
    pafOrganisationName: 'c pafOrganisationName',
    line1: 'c line1',
    line2: 'c line2',
    line3: 'c line3',
    line4: 'c line4',
    line5: 'c line5',
    buildingNumberRange: 'buildingNumberRange',
    buildingName: 'buildingName',
    flatName: 'flatName',
    street: 'street',
    city: 'city',
    county: 'county',
    postalCode: '1231231',
    country: 'USA',
    uprn: '10008042952',
    dependentLocality: 'HIGH HAWSKER',
    doubleDependentLocality: 'doubleDependentLocality'
  },
  phone: {
    mobile: '01234042273',
    landline: '01234613020'
  },
  email: {
    address: 'hadleyfarmsltdp@defra.com.test'
  },
  correspondenceEmail: {
    address: 'hadleyfarmsltdp@defra.com.123'
  },
  correspondencePhone: {
    mobile: '07111222333',
    landline: '01225111222'
  },
  isCorrespondenceAsBusinessAddr: false
}

const orgDetailsUpdatePayload = {
  name: 'HADLEY FARMS LTD 2',
  address: {
    address1: 'line1',
    address2: 'line2',
    address3: 'line3',
    address4: 'line4',
    address5: 'line5',
    pafOrganisationName: 'pafOrganisationName',
    flatName: null,
    buildingNumberRange: 'buildingNumberRange',
    buildingName: 'COLSHAW HALL',
    street: 'street',
    city: 'BRAINTREE',
    county: null,
    postalCode: '12312312',
    country: 'United Kingdom',
    uprn: '123123123',
    dependentLocality: 'HIGH HAWSKER',
    doubleDependentLocality: null
  },
  correspondenceAddress: {
    pafOrganisationName: 'c pafOrganisationName',
    address1: 'c line1',
    address2: 'c line2',
    address3: 'c line3',
    address4: 'c line4',
    address5: 'c line5',
    buildingNumberRange: 'buildingNumberRange',
    buildingName: 'buildingName',
    flatName: 'flatName',
    street: 'street',
    city: 'city',
    county: 'county',
    postalCode: '1231231',
    country: 'USA',
    uprn: '10008042952',
    dependentLocality: 'HIGH HAWSKER',
    doubleDependentLocality: 'doubleDependentLocality'
  },
  isCorrespondenceAsBusinessAddr: false,
  email: 'hadleyfarmsltdp@defra.com.test',
  landline: '01234613020',
  mobile: '01234042273',
  correspondenceEmail: 'hadleyfarmsltdp@defra.com.123',
  correspondenceLandline: '01225111222',
  correspondenceMobile: '07111222333',
  businessType: { id: 0 }
}

//  Nock is setup separately in each test to ensure the order and number of requests is as expected
describe('business', () => {
  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  test('update business details full payload', async () => {
    nock.disableNetConnect()

    const v1 = nock(config.get('kits.gatewayUrl'))

    v1.post('/organisation/search', {
      searchFieldType: 'SBI',
      primarySearchPhrase: 'sbi',
      offset: 0,
      limit: 1
    }).reply(200, {
      _data: [
        {
          id: 'organisationId'
        }
      ]
    })

    v1.put('/organisation/organisationId/business-details', orgDetailsUpdatePayload).reply(204)

    v1.post('/organisation/search', {
      searchFieldType: 'SBI',
      primarySearchPhrase: 'sbi',
      offset: 0,
      limit: 1
    }).reply(200, {
      _data: [
        {
          id: 'organisationId'
        }
      ]
    })

    v1.get('/organisation/organisationId').reply(200, {
      _data: {
        id: 'organisationId',
        sbi: 'sbi',
        legalStatus: {
          code: 101,
          type: 'legal type'
        },
        ...orgDetailsUpdatePayload
      }
    })

    const query = `
      mutation Mutation($input: UpdateBusinessDetailsInput!) {
        updateBusinessDetails(input: $input) { 
          success
          business {
            info {
              address {
                buildingName
                buildingNumberRange
                city
                country
                county
                dependentLocality
                doubleDependentLocality
                flatName
                line1
                line2
                line3
                line4
                line5
                pafOrganisationName
                postalCode
                street
                uprn
              }
              correspondenceAddress {
                buildingName
                buildingNumberRange
                city
                country
                county
                dependentLocality
                doubleDependentLocality
                flatName
                line1
                line2
                line3
                line4
                line5
                pafOrganisationName
                postalCode
                street
                uprn
              }
              correspondencePhone {
                landline
                mobile
              }
              email {
                address
              }
              isCorrespondenceAsBusinessAddr
              name
              phone {
                landline
                mobile
              }
              correspondenceEmail {
                address
              }
            }
          }
        }
      }
    `
    const result = await makeTestQuery(query, true, {
      input: {
        sbi: 'sbi',
        details: businessDetailsUpdatePayload
      }
    })

    expect(result).toEqual({
      data: {
        updateBusinessDetails: {
          success: true,
          business: {
            info: {
              ...businessDetailsUpdatePayload
            }
          }
        }
      }
    })
  })

  test('update business details partial payload', async () => {
    nock.disableNetConnect()

    const v1 = nock(config.get('kits.gatewayUrl'))

    v1.post('/organisation/search', {
      searchFieldType: 'SBI',
      primarySearchPhrase: 'sbi',
      offset: 0,
      limit: 1
    }).reply(200, {
      _data: [
        {
          id: 'organisationId'
        }
      ]
    })

    v1.get('/organisation/organisationId').reply(200, {
      _data: {
        id: 'organisationId',
        sbi: 'sbi',
        name: 'EXISTING BUSINESS NAME',
        email: 'email address',
        address: {
          address1: 'line1',
          address2: 'line2',
          address3: 'line3',
          address4: 'line4',
          address5: 'line5',
          pafOrganisationName: 'paf organisation name',
          buildingNumberRange: 'building number range',
          buildingName: 'building name',
          flatName: 'flat name',
          street: 'street',
          city: 'city',
          county: 'county',
          postalCode: 'postal code',
          country: 'country',
          uprn: 'uprn',
          dependentLocality: 'dependent locality',
          doubleDependentLocality: 'double dependent locality',
          addressTypeId: 'address type'
        },
        correspondenceAddress: {
          address1: null,
          address2: null,
          address3: null,
          address4: null,
          address5: null,
          pafOrganisationName: 'c pafOrganisationName',
          flatName: 'flatName',
          buildingNumberRange: 'buildingNumberRange',
          buildingName: 'buildingName',
          street: 'street',
          city: 'city',
          county: 'county',
          postalCode: '1231231',
          country: 'USA',
          uprn: '10008042952',
          dependentLocality: 'HIGH HAWSKER',
          doubleDependentLocality: 'doubleDependentLocality',
          addressTypeId: null
        },
        legalStatus: {
          id: 101,
          type: 'legal type'
        },
        landline: 'landline number',
        mobile: 'mobile number',
        traderNumber: 'trader number',
        businessType: {
          id: 101,
          type: 'business type'
        },
        taxRegistrationNumber: 'vat number',
        vendorNumber: 'vendor number',
        businessReference: 'businessReference',
        isCorrespondenceAsBusinessAddr: false,
        correspondenceEmail: 'hadleyfarmsltdp@defra.com.test',
        correspondenceEmailValidated: false,
        correspondenceLandline: 'corr landline',
        correspondenceMobile: 'corr mobile'
      }
    })

    v1.put('/organisation/organisationId/business-details', {
      ...orgDetailsUpdatePayload,
      name: 'EXISTING BUSINESS NAME'
    }).reply(204)

    v1.post('/organisation/search', {
      searchFieldType: 'SBI',
      primarySearchPhrase: 'sbi',
      offset: 0,
      limit: 1
    }).reply(200, {
      _data: [
        {
          id: 'organisationId'
        }
      ]
    })

    v1.get('/organisation/organisationId').reply(200, {
      _data: {
        id: 'organisationId',
        sbi: 'sbi',
        name: 'EXISTING BUSINESS NAME',
        email: 'email address',
        address: {
          address1: 'line1',
          address2: 'line2',
          address3: 'line3',
          address4: 'line4',
          address5: 'line5',
          pafOrganisationName: 'paf organisation name',
          buildingNumberRange: 'building number range',
          buildingName: 'building name',
          flatName: 'flat name',
          street: 'street',
          city: 'city',
          county: 'county',
          postalCode: 'postal code',
          country: 'country',
          uprn: 'uprn',
          dependentLocality: 'dependent locality',
          doubleDependentLocality: 'double dependent locality',
          addressTypeId: 'address type'
        },
        correspondenceAddress: {
          address1: null,
          address2: null,
          address3: null,
          address4: null,
          address5: null,
          pafOrganisationName: 'c pafOrganisationName',
          flatName: 'flatName',
          buildingNumberRange: 'buildingNumberRange',
          buildingName: 'buildingName',
          street: 'street',
          city: 'city',
          county: 'county',
          postalCode: '1231231',
          country: 'USA',
          uprn: '10008042952',
          dependentLocality: 'HIGH HAWSKER',
          doubleDependentLocality: 'doubleDependentLocality',
          addressTypeId: null
        },
        legalStatus: {
          id: 101,
          type: 'legal type'
        },
        landline: 'landline number',
        mobile: 'mobile number',
        traderNumber: 'trader number',
        businessType: {
          id: 101,
          type: 'business type'
        },
        taxRegistrationNumber: 'vat number',
        vendorNumber: 'vendor number',
        businessReference: 'businessReference',
        isCorrespondenceAsBusinessAddr: false,
        correspondenceEmail: 'hadleyfarmsltdp@defra.com.test',
        correspondenceEmailValidated: false,
        correspondenceLandline: 'corr landline',
        correspondenceMobile: 'corr mobile'
      }
    })

    const query = `
      mutation Mutation($input: UpdateBusinessDetailsInput!) {
        updateBusinessDetails(input: $input) { 
          success
          business {
            info {
              address {
                buildingName
                buildingNumberRange
                city
                country
                county
                dependentLocality
                doubleDependentLocality
                flatName
                line1
                line2
                line3
                line4
                line5
                pafOrganisationName
                postalCode
                street
                typeId
                uprn
              }
              correspondenceAddress {
                buildingName
                buildingNumberRange
                city
                country
                county
                dependentLocality
                doubleDependentLocality
                flatName
                line1
                line2
                line3
                line4
                line5
                pafOrganisationName
                postalCode
                street
                typeId
                uprn
              }
              correspondencePhone {
                landline
                mobile
              }
              email {
                address
              }
              isCorrespondenceAsBusinessAddr
              legalStatus {
                code
                type
              }
              name
              phone {
                landline
                mobile
              }
              correspondenceEmail {
                address
              }
            }
          }
        }
      }
    `

    // delete name to trigger getting org details to determine value
    delete businessDetailsUpdatePayload.name

    const result = await makeTestQuery(query, true, {
      input: {
        sbi: 'sbi',
        details: businessDetailsUpdatePayload
      }
    })

    expect(result).toEqual({
      data: {
        updateBusinessDetails: {
          success: true,
          business: {
            info: {
              name: 'EXISTING BUSINESS NAME',
              address: {
                line1: 'line1',
                line2: 'line2',
                line3: 'line3',
                line4: 'line4',
                line5: 'line5',
                pafOrganisationName: 'paf organisation name',
                buildingNumberRange: 'building number range',
                buildingName: 'building name',
                flatName: 'flat name',
                street: 'street',
                city: 'city',
                county: 'county',
                postalCode: 'postal code',
                country: 'country',
                uprn: 'uprn',
                dependentLocality: 'dependent locality',
                doubleDependentLocality: 'double dependent locality',
                typeId: 'address type'
              },
              correspondenceAddress: {
                line1: null,
                line2: null,
                line3: null,
                line4: null,
                line5: null,
                pafOrganisationName: 'c pafOrganisationName',
                flatName: 'flatName',
                buildingNumberRange: 'buildingNumberRange',
                buildingName: 'buildingName',
                street: 'street',
                city: 'city',
                county: 'county',
                postalCode: '1231231',
                country: 'USA',
                uprn: '10008042952',
                dependentLocality: 'HIGH HAWSKER',
                doubleDependentLocality: 'doubleDependentLocality',
                typeId: null
              },
              correspondencePhone: {
                landline: 'corr landline',
                mobile: 'corr mobile'
              },
              email: {
                address: 'email address'
              },
              isCorrespondenceAsBusinessAddr: false,
              legalStatus: {
                code: 101,
                type: 'legal type'
              },
              phone: {
                landline: 'landline number',
                mobile: 'mobile number'
              },
              correspondenceEmail: {
                address: 'hadleyfarmsltdp@defra.com.test'
              }
            }
          }
        }
      }
    })
  })
})
