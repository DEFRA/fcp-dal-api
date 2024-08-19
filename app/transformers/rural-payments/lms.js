export function transformLandCovers (landCovers) {
  return landCovers.map(({ id, info }) => {
    const { nonZeroArea, name } = info.find(({ area }) => area !== 0)

    return {
      id,
      nonZeroArea,
      name: name.toUpperCase().split(' ').join('_')
    }
  })
}

export function transformLandCoversToArea (name, landCovers) {
  const { area } = landCovers.find(landCover => landCover.name === name)
  return area
}

export function transformLandParcels (landParcels) {
  return landParcels.map(({ id, sheetId, area }) => ({
    id: `${id}`,
    sheetId,
    area
  }))
}
