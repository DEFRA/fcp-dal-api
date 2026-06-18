import { validateUpstreamTimestampToISO } from '../../utils/date.js'
import { convertSquareMetersToHectares } from '../../utils/numbers.js'
import { transformDateTimeToISO } from '../common.js'

export function transformLandCovers(landCover) {
  const items = landCover?.features || []
  return items
    .filter((item) => item?.properties?.area !== '0')
    .map(({ id, properties, geometry }) => {
      const { code, area, name, isBpsEligible } = properties
      return {
        id,
        code,
        area: convertSquareMetersToHectares(area),
        name: name,
        isBpsEligible: isBpsEligible === 'true',
        geometry
      }
    })
}

export function transformLandParcelsEffectiveDates(parcelId, sheetId, parcels) {
  const parcel = parcels.find((p) => p.parcelId === parcelId && p.sheetId === sheetId)

  return {
    effectiveFrom: validateUpstreamTimestampToISO(parcel?.validFrom),
    effectiveTo: validateUpstreamTimestampToISO(parcel?.validTo)
  }
}

export function transformLandCoversToArea(name, landCovers) {
  if (!landCovers || !Array.isArray(landCovers)) {
    return 0
  }
  const landCover = landCovers.find((cover) => cover?.name === name)
  if (!landCover?.area) {
    return 0
  }
  return convertSquareMetersToHectares(landCover.area)
}

// Builds a lookup so each parcel's geometry can be efficiently obtained.
// Keyed as a single string since organisationGeometries and parcels come from two
// separate upstream calls and need to be joined by sheetId+parcelId here.
function indexGeometriesBySheetAndParcelId(parcelGeometries) {
  const features = parcelGeometries?.features || []

  return new Map(
    features.map(({ geometry, properties }) => [
      `${properties.sheetId}:${properties.parcelId}`,
      geometry
    ])
  )
}

export function transformAndMergeParcelGeometries(parcels, organisationGeometries) {
  const parcelGeometries = indexGeometriesBySheetAndParcelId(organisationGeometries)

  return parcels.map((parcel) => ({
    ...parcel,
    geometry: parcelGeometries.get(`${parcel.sheetId}:${parcel.parcelId}`) ?? null
  }))
}

export function transformLandParcels(landParcels) {
  return landParcels.map((parcel) => {
    return {
      ...parcel,
      id: `${parcel.id}`, // Transform to string to match the type in the graphql schema
      area: convertSquareMetersToHectares(parcel.area)
    }
  })
}

export function transformTotalParcels(landParcels) {
  return landParcels.length
}

export function transformTotalArea(landCovers) {
  const totalMeterageArea = landCovers.reduce((totalArea, { area }) => totalArea + area, 0)
  return convertSquareMetersToHectares(totalMeterageArea)
}

export function transformLandUses(landUses) {
  return landUses.map((landUse) => ({
    startDate: transformDateTimeToISO(landUse.start_date),
    endDate: transformDateTimeToISO(landUse.end_date),
    insertDate: transformDateTimeToISO(landUse.dt_insert),
    deleteDate: transformDateTimeToISO(landUse.dt_delete),
    campaign: landUse.campaign,
    code: landUse.lu_code,
    type: landUse.landuse,
    area: landUse.area && convertSquareMetersToHectares(landUse.area),
    length: landUse.length
  }))
}
