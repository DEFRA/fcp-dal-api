export const transformOrganisationToBusiness = (data) => {
  return {
    info: {
      name: data.name,
      reference: data.businessReference,
      vat: null,
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
      phone: {
        mobile: data.mobile,
        landline: data.landline,
        fax: data.fax
      },
      email: {
        address: data.email
      },
      legalStatus: {
        code: data.legalStatus.id,
        type: data.legalStatus.type
      },
      type: {
        code: data.businessType.id,
        type: data.businessType.type
      },
      registrationNumbers: {
        companiesHouse: data.companiesHouseRegistrationNumber,
        charityCommission: data.charityCommissionRegistrationNumber
      }
    },
    id: data.id
  }
}
