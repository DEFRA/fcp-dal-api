export function transformOrganisationCPH (organisationId, data = []) {
  if (!organisationId) {
    return null
  }

  if (!data) {
    return null
  }

  return data.map(({ cphNumber, parcelNumbers }) => ({
    organisationId,
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
