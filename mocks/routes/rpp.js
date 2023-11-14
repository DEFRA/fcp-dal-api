const { faker } = require('@faker-js/faker/locale/en_GB')

const organisationResponse = {}

module.exports = [
  {
    id: "rpp-api-get-login",
    url: "/rpp/login",
    method: ["GET"],
    variants: [
      {
        id: "default",
        type: "text",
        options: {
          status: 200,
          body: `<html><input name="csrfToken" value"${faker.string.uuid()}"></html>`,
        }
      }
    ]
  },
  {
    id: "rpp-api-post-login",
    url: "/rpp/login",
    method: ["POST"],
    variants: [
      {
        id: "default",
        type: "status",
        options: {
          status: 301,
          headers: {
            location: 'authenticate'
          }
        }
      }
    ]
  },
  {
    id: "rpp-api-get-authenticate",
    url: "/rpp/authenticate",
    method: ["GET"],
    variants: [
      {
        id: "default",
        type: "status",
        options: {
          status: 200,
          headers: {
            cookie: `AUTH_SESSION=${faker.string.uuid()};CapdAccessToken=${faker.string.uuid()};`
          }
        }
      }
    ]
  },
  {
    id: "rpp-api-person-context",
    url: "/rpp/api/person/context",
    method: ["GET"],
    variants: [
      {
        id: "default",
        type: "status",
        options: {
          status: 200
        }
      }
    ]
  },
  {
    id: "rpp-api-person",
    url: "/rpp/api/person/:personId",
    method: ["GET"],
    variants: [
      {
        id: "default",
        type: "json",
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
          },
        }
      }
    ]
  },
  {
    id: "rpp-api-organisation",
    url: "/rpp/api/organisation/:orgId",
    method: ["POST"],
    variants: [
      {
        id: "default",
        type: "json",
        options: {
          status: 200,
          body: organisationResponse,
        }
      }
    ]
  }
];
