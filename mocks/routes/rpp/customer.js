const { faker } = require('@faker-js/faker/locale/en_GB')

module.exports = [
  {
    id: 'rpp-customer-get-by-id',
    url: '/rpp/api/person/:personId',
    method: ['GET'],
    variants: [
      {
        id: 'default',
        type: 'json',
        options: {
          status: 200,
          body: {
            _data: {
              title: faker.person.prefix(),
              otherTitle: null,
              firstName: faker.person.firstName(),
              middleName: faker.person.middleName(),
              lastName: faker.person.lastName(),
              dateOfBirth: faker.date.birthdate(),
              landline: null,
              mobile: faker.string.numeric(10),
              email: faker.internet.email(),
              doNotContact: false,
              emailValidated: false,
              address: {
                pafOrganisationName: null,
                flatName: null,
                buildingNumberRange: null,
                buildingName: faker.location.buildingNumber(),
                street: faker.location.street(),
                city: faker.location.city(),
                county: faker.location.county(),
                postalCode: faker.location.zipCode(),
                country: 'United Kingdom',
                uprn: null,
                dependentLocality: null,
                doubleDependentLocality: null,
                addressTypeId: null
              },
              locked: false,
              id: faker.string.numeric(6),
              confirmed: null,
              customerReferenceNumber: faker.string.numeric(10),
              personalIdentifiers: null,
              deactivated: false
            }
          }
        }
      }
    ]
  },
  {
    id: 'rpp-customer-get-by-crn',
    url: '/rpp/api/person/search',
    method: ['POST'],
    variants: [
      {
        id: 'default',
        type: 'json',
        options: {
          status: 200,
          body: {
            _data: [
              {
                fullName: `${faker.person.firstName()} ${faker.person.lastName()}`,
                primaryAddress: {
                  pafOrganisationName: null,
                  flatName: null,
                  buildingNumberRange: null,
                  buildingName: faker.location.buildingNumber(),
                  street: faker.location.street(),
                  city: faker.location.city(),
                  county: faker.location.county(),
                  postalCode: faker.location.zipCode(),
                  country: 'United Kingdom',
                  uprn: null,
                  dependentLocality: null,
                  doubleDependentLocality: null,
                  addressTypeId: null
                },
                personalIdentifiers: [faker.string.numeric(9)],
                nationalInsuranceNumber: null,
                customerReference: faker.string.numeric(10),
                email: faker.internet.email(),
                locked: faker.datatype.boolean(),
                deactivated: faker.datatype.boolean()
              }
            ],
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
