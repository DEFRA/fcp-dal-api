const squareMetersToHectares = 0.0001

export const convertSquareMetersToHectares = (area) => {
  const result = parseFloat((parseFloat(area) * squareMetersToHectares).toFixed(4))
  return isNaN(result) ? null : result
}
