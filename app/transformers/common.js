export const kitsAddressToDalAddress = (address) => {
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

export const dalAddressToKitsAddress = (address) => {
  return {
    address1: address?.line1,
    address2: address?.line2,
    address3: address?.line3,
    address4: address?.line4,
    address5: address?.line5,
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
    addressTypeId: address?.typeId
  }
}

export const booleanise = (value) => !!value

export const transformEntityStatus = (entity) => ({
  locked: booleanise(entity?.locked),
  deactivated: booleanise(entity?.deactivated),
  confirmed: booleanise(entity?.confirmed)
})

export function transformToISODate(timestamp) {
  if (!timestamp || typeof timestamp === 'boolean' || typeof timestamp === 'object') {
    return null
  }

  const date = new Date(Number.isNaN(+timestamp) ? timestamp : +timestamp)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export const transformDateTimeToISO = (dateTime) => {
  // ensure the input looks like a date-time string, with at least seconds, up to full timestamp
  const parts = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}):?(.+)?$/.exec(dateTime)

  if (parts?.length) {
    return new Date(`${parts[1]}.${parts[2] || '000+0000'}`).toISOString()
  }

  return null
}
