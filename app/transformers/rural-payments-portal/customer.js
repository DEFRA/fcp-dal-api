export const ruralPaymentsPortalCustomerTransformer = (data) => {
  return {
    info: {
      name: {
        title: data.title,
        otherTitle: data.otherTitle,
        first: data.firstName,
        middle: data.middleName,
        last: data.lastName
      },
      dateOfBirth: data.dateOfBirth,
      phone: {
        mobile: data.mobile,
        landline: data.landline
      },
      email: {
        address: data.email
      },
      address: {
        line1: data.address.address1,
        line2: data.address.address2,
        line3: data.address.address3,
        line4: data.address.address4,
        line5: data.address.address5,
        pafOrganisationName: data.address.pafOrganisationName,
        buildingNumberRange: data.address.buildingNumberRange,
        buildingName: data.address.buildingName,
        flatName: data.address.flatName,
        street: data.address.street,
        city: data.address.city,
        county: data.address.county,
        postalCode: data.address.postalCode,
        country: data.address.country,
        uprn: data.address.uprn,
        dependentLocality: data.address.dependentLocality,
        doubleDependentLocality: data.address.doubleDependentLocality,
        typeId: data.address.addressTypeId
      },
      status: {
        locked: data.locked,
        confirmed: data.confirmed,
        deactivated: data.deactivated
      }
    },
    id: data.id
  }
}
