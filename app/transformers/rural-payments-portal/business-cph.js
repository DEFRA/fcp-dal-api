export function transformOrganisationCPH (businessId, data = []) {
  if (!businessId) {
    return null
  }

  if (!data) {
    return null
  }

  return data.map(({ cphNumber, parcelNumbers }) => ({
    businessId,
    number: cphNumber,
    parcelNumbers
  }))
}

export function transformOrganisationCPHCoordinates (data = {}) {
  if (!data) {
    return null
  }

  return {
    y: data.yCoordinate,
    x: data.xCoordinate
  }
}
