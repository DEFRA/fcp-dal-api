export function findCustomerByReferenceHandler (reference) {
  return {
    referenceNumber: reference,
    dateOfBirth: "283996800000",
    name: {
      title: 'Mr',
      otherTitle: null,
      first: 'John',
      middle: 'William',
      last: 'Doe'
    },
    address: {
      line1: "101 Albert Road",
      line2: null,
      line3: null,
      line4: null,
      line5: null,
      pafOrganisationName: null,
      buildingNumberRange: null,
      buildingName: null,
      flatName: null,
      street: "Albert Road",
      city: "London",
      county: "Greater London",
      postalCode: "E1 8SA",
      country: "United Kingdom",
      uprn: null,
      dependentLocality: null,
      doubleDependentLocality: null,
      addressTypeId: null,
    },
    phone: {
      mobile: "07821232132",
      landline: "202 4213 13321",
      fax: null,
    },
    email: {
      address: "john.doe@example.com",
      validated: false,
      doNotContact: false,
    },
    status: {
      locked: false,
      confirmed: false,
      deactivated: false,
    },
    authenticationQuestions: {
      memorableDate: "08/01/2023",
      memorableEvent: "Birthday celebration in Vegas",
      memorablePlace: "Milan, Italy"
    }
  }
}
