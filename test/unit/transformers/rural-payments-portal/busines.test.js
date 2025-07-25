import { transformOrganisationToBusiness } from '../../../../app/transformers/rural-payments/business.js'

const organisation = {
  id: 11111,
  name: 'org name',
  sbi: 11111111,
  additionalSbiIds: [11111112],
  confirmed: true,
  lastUpdatedOn: 1622119577305,
  landConfirmed: true,
  deactivated: true,
  locked: true,
  address: {
    address1: 'line1',
    address2: 'line2',
    address3: 'line3',
    address4: 'line4',
    address5: 'line5',
    pafOrganisationName: 'paf org name',
    flatName: 'flat name',
    buildingNumberRange: 'building number range',
    buildingName: 'building name',
    street: 'street',
    city: 'city',
    county: 'county',
    postalCode: 'post code',
    country: 'country',
    uprn: 'uprn',
    dependentLocality: 'dependentLocality',
    doubleDependentLocality: 'doubleDependentLocality',
    addressTypeId: null
  },
  correspondenceAddress: {
    address1: 'correspondence line1',
    address2: 'correspondence line2',
    address3: 'correspondence line3',
    address4: 'correspondence line4',
    address5: 'correspondence line5',
    pafOrganisationName: 'correspondence paf org name',
    flatName: 'correspondence flat name',
    buildingNumberRange: 'correspondence building number range',
    buildingName: 'correspondence building name',
    street: 'correspondence street',
    city: 'correspondence city',
    county: 'correspondence county',
    postalCode: 'correspondence post code',
    country: 'correspondence country',
    uprn: 'correspondence uprn',
    dependentLocality: 'correspondence dependentLocality',
    doubleDependentLocality: 'correspondence doubleDependentLocality',
    addressTypeId: null
  },
  isFinancialToBusinessAddr: true,
  isCorrespondenceAsBusinessAddr: true,
  email: 'email address',
  emailValidated: true,
  landline: 'landline',
  mobile: 'mobile',
  fax: 'fax',
  correspondenceEmail: 'correspondence email address',
  correspondenceEmailValidated: true,
  correspondenceLandline: 'correspondence landline',
  correspondenceMobile: 'correspondence mobile',
  correspondenceFax: 'correspondence fax',
  taxRegistrationNumber: 'vat taxRegistrationNumber',
  businessType: {
    id: 101404,
    type: 'businessType type'
  },
  businessReference: 'businessReference',
  legalStatus: {
    id: 101404,
    type: 'legalStatus type'
  },
  dateStartedFarming: 1622119577305,
  companiesHouseRegistrationNumber: 'companiesHouseRegistrationNumber',
  charityCommissionRegistrationNumber: 'charityCommissionRegistrationNumber',
  persons: [],
  hasLandInNorthernIreland: true,
  hasLandInScotland: true,
  hasLandInWales: true,
  hasAdditionalBusinessActivities: true,
  vendorNumber: 'vendorNumber',
  traderNumber: 'traderNumber',
  isAccountablePeopleDeclarationCompleted: true,
  additionalBusinessActivities: [{ id: 101404, type: 'additionalBusinessActivities type' }]
}

describe('Business transformer', () => {
  test('transformOrganisationToBusiness', () => {
    expect(transformOrganisationToBusiness(organisation)).toEqual({
      organisationId: '11111',
      info: {
        additionalBusinessActivities: [{ code: 101404, type: 'additionalBusinessActivities type' }],
        additionalSbis: [11111112],
        lastUpdated: new Date('2021-05-27T12:46:17.305Z'),
        address: {
          line1: 'line1',
          line2: 'line2',
          line3: 'line3',
          line4: 'line4',
          line5: 'line5',
          pafOrganisationName: 'paf org name',
          flatName: 'flat name',
          buildingNumberRange: 'building number range',
          buildingName: 'building name',
          street: 'street',
          city: 'city',
          county: 'county',
          postalCode: 'post code',
          country: 'country',
          uprn: 'uprn',
          dependentLocality: 'dependentLocality',
          doubleDependentLocality: 'doubleDependentLocality',
          typeId: null
        },
        correspondenceAddress: {
          line1: 'correspondence line1',
          line2: 'correspondence line2',
          line3: 'correspondence line3',
          line4: 'correspondence line4',
          line5: 'correspondence line5',
          pafOrganisationName: 'correspondence paf org name',
          flatName: 'correspondence flat name',
          buildingNumberRange: 'correspondence building number range',
          buildingName: 'correspondence building name',
          street: 'correspondence street',
          city: 'correspondence city',
          county: 'correspondence county',
          postalCode: 'correspondence post code',
          country: 'correspondence country',
          uprn: 'correspondence uprn',
          dependentLocality: 'correspondence dependentLocality',
          doubleDependentLocality: 'correspondence doubleDependentLocality',
          typeId: null
        },
        dateStartedFarming: new Date('2021-05-27T12:46:17.305Z'),
        email: {
          address: 'email address',
          validated: true
        },
        correspondenceEmail: {
          address: 'correspondence email address',
          validated: true
        },
        hasAdditionalBusinessActivities: true,
        hasLandInNorthernIreland: true,
        hasLandInScotland: true,
        hasLandInWales: true,
        isAccountablePeopleDeclarationCompleted: true,
        isCorrespondenceAsBusinessAddress: true,
        isFinancialToBusinessAddress: true,
        landConfirmed: true,
        legalStatus: { code: 101404, type: 'legalStatus type' },
        name: 'org name',
        phone: { fax: 'fax', landline: 'landline', mobile: 'mobile' },
        correspondencePhone: {
          mobile: 'correspondence mobile',
          landline: 'correspondence landline',
          fax: 'correspondence fax'
        },
        reference: 'businessReference',
        registrationNumbers: {
          charityCommission: 'charityCommissionRegistrationNumber',
          companiesHouse: 'companiesHouseRegistrationNumber'
        },
        traderNumber: 'traderNumber',
        type: { code: 101404, type: 'businessType type' },
        vat: 'vat taxRegistrationNumber',
        vendorNumber: 'vendorNumber',
        status: {
          deactivated: true,
          confirmed: true,
          locked: true
        }
      },
      sbi: '11111111'
    })
  })
})
