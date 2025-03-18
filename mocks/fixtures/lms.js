import files from '../utils/files.js'

const { getJSON } = files(import.meta.url)

export const coversSummary = (orgId) => {
  return getJSON(`./orgId/${orgId}/covers-summary.json`)
}

export const landCovers = (orgId) => {
  return getJSON(`./orgId/${orgId}/land-covers.json`)
}

export const landCover = (orgId, sheetId, parcelId) => {
  const covers = landCovers(orgId)
  const parcelCovers = covers.find(
    (cover) => cover.id.includes(parcelId) && cover.id.includes(sheetId)
  )

  return {
    type: 'FeatureCollection',
    features: parcelCovers.info.map((cover) => {
      return {
        id: cover.code,
        geometry: null,
        properties: {
          area: `${cover.area}`,
          code: cover.code,
          name: cover.name,
          isBpsEligible: true
        },
        type: 'Feature'
      }
    })
  }
}

export const landParcels = (orgId) => {
  return getJSON(`./orgId/${orgId}/land-parcels.json`)
}

export const landParcelDates = (orgId) => {
  const parcels = landParcels(orgId)
  const parcelsDates = getJSON(`./orgId/${orgId}/land-parcels-effective-dates.json`)
  return parcels.map((parcel) => {
    const parcelDates = parcelsDates.find((date) => date.parcelId === parcel.parcelId)
    return {
      sheetId: parcel.sheetId,
      parcelId: parcel.parcelId,
      validFrom: parcelDates.validFrom,
      validTo: parcelDates.validTo
    }
  })
}

export const landParcelsGeometry = (orgId) => {
  return getJSON(`./orgId/${orgId}/land-parcels-geometry.json`)
}
