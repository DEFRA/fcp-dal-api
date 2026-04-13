const squareMetersToHectares = 0.0001

export const convertSquareMetersToHectares = (area) => {
  const result = Number.parseFloat((Number.parseFloat(area) * squareMetersToHectares).toFixed(4))
  return Number.isNaN(result) ? null : result
}
