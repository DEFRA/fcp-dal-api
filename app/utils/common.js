export function transformAddress(address) {
  return {
    line1: address?.address1,
    line2: address?.address2,
    line3: address?.address3,
    line4: address?.address4,
    line5: address?.address5,
    pafOrganisationName: address?.pafOrganisationName,
    buildingNumberRange: address?.buildingNumberRange,
    buildingName: address?.buildingName,
    flatName: address?.flatName,
    street: address?.street,
    city: address?.city,
    county: address?.county,
    postalCode: address?.postalCode,
    country: address?.country,
    uprn: address?.uprn,
    dependentLocality: address?.dependentLocality,
    doubleDependentLocality: address?.doubleDependentLocality,
    typeId: address?.addressTypeId
  }
}
