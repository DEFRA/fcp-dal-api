import { validateDate } from '../../utils/date.js'
import { convertSquareMetersToHectares } from '../../utils/numbers.js'
import { transformDateTimeToISO } from '../common.js'

export function transformLandCovers(landCover) {
  const items = landCover?.features || []
  return items
    .filter((item) => item?.properties?.area !== '0')
    .map(({ id, properties }) => {
      const { code, area, name, isBpsEligible } = properties
      return {
        id,
        code,
        area: convertSquareMetersToHectares(area),
        name: name,
        isBpsEligible: isBpsEligible === 'true'
      }
    })
}

export function transformLandParcelsEffectiveDates(parcelId, sheetId, parcels) {
  const parcel = parcels.find((p) => p.parcelId === parcelId && p.sheetId === sheetId)

  return {
    effectiveFrom: validateDate(parcel?.validFrom).toISOString(),
    effectiveTo: validateDate(parcel?.validTo).toISOString()
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
    area: landUse.area,
    length: landUse.length
  }))
}
