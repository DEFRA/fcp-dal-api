export function transformOrganisationCPH (id, data) {
  if (!id) {
    return null
  }

  if (!data) {
    return null
  }

  return data.map(({ cphNumber, parcelNumbers }) => ({
    id,
    number: cphNumber,
    parcelNumbers
  }))
}

export function transformOrganisationCPHCoordinates (data) {
  if (!data) {
    return null
  }

  return {
    y: data.yCoordinate,
    x: data.xCoordinate
  }
}
