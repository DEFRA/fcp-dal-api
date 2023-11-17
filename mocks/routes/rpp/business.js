const { faker } = require('@faker-js/faker/locale/en_GB')

const business = () => ({
  id: faker.string.numeric(7),
  name: faker.company.name(),
  sbi: parseInt(faker.string.numeric(9)),
  // "additionalSbiIds": [],
  confirmed: false,
  // "lastUpdatedOn": 1645694991141,
  // "landConfirmed": true,
  deactivated: false,
  locked: false,
  address: {
    address1: null,
    address2: null,
    address3: null,
    address4: null,
    address5: null,
    pafOrganisationName: null,
    flatName: null,
    buildingNumberRange: null,
    buildingName: null,
    street: null,
    city: 'HEATHFIELD',
    county: null,
    postalCode: 'TA2 8LH',
    country: 'United Kingdom',
    uprn: '200001642435',
    dependentLocality: null,
    doubleDependentLocality: null,
    addressTypeId: null
  },
  // "correspondenceAddress": null,
  // "isFinancialToBusinessAddr": null,
  // "isCorrespondenceAsBusinessAddr": null,
  email: 'lynehouseliveryq@yrevilesuohenyli.com.test',
  emailValidated: false,
  landline: '01234394643',
  mobile: null,
  fax: null,
  // "correspondenceEmail": null,
  // "correspondenceEmailValidated": false,
  // "correspondenceLandline": null,
  // "correspondenceMobile": null,
  // "correspondenceFax": null,
  // "taxRegistrationNumber": null,
  businessType: {
    id: 101443,
    type: 'Not Specified'
  },
  businessReference: '9100974309',
  legalStatus: {
    id: 102111,
    type: 'Sole Proprietorship'
  },

  // "dateStartedFarming": null,
  companiesHouseRegistrationNumber: null,
  charityCommissionRegistrationNumber: null
  // "persons": [],
  // "hasLandInNorthernIreland": null,
  // "hasLandInScotland": null,
  // "hasLandInWales": null,
  // "hasAdditionalBusinessActivities": null,
  // "vendorNumber": "329756G",
  // "traderNumber": null,
  // "isAccountablePeopleDeclarationCompleted": null,
  // "additionalBusinessActivities": null
})

module.exports = [
  {
    id: 'rpp-business-get-by-id',
    url: '/rpp/api/organisation/:orgId',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'json',
        options: {
          status: 200,
          body: {
            _data: business()
          }
        }
      }
    ]
  },
  {
    id: 'rpp-business-get-by-sbi',
    url: '/rpp/api/organisation/search',
    method: ['POST'],
    variants: [
      {
        id: 'default',
        type: 'json',
        options: {
          status: 200,
          body: {
            _data: [business()],
            _page: {
              number: 0,
              size: 20,
              totalPages: 1,
              numberOfElements: 1,
              totalElements: 1
            }
          }
        }
      }
    ]
  }
]
