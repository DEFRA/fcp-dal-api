export function transformRuralPaymentsAgencyLandAPILandCovers (
  parcelId,
  landCovers
) {
  return landCovers.features
    .filter(({ properties }) => properties.REFERENCE_PARCELS_ID === parcelId)
    .map(({ properties }) => ({
      id: properties.ID,
      classCode: properties.LAND_COVER_CLASS_CODE,
      description: properties.DESCRIPTION.toUpperCase().split(' ').join('_'),
      area: properties.AREA_HA
    }))
}

export function transformRuralPaymentsAgencyLandAPILandParcels (
  sbi,
  landParcels
) {
  return landParcels.features.map(({ properties }) => ({
    sbi,
    id: properties.ID,
    area: properties.AREA_HA
  }))
}

export function transformRuralPaymentsAgencyLandAPILandParcelsToSummary (
  landParcels
) {
  return {
    numberOfParcels: landParcels.features.length,
    totalArea: landParcels.features.reduce(
      (totalArea, { properties }) => totalArea + Number(properties.AREA_HA),
      0
    )
  }
}
