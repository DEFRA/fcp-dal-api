const squareMetersToHectares = 0.0001
export const convertSquareMetersToHectares = (area) =>
  parseFloat((parseFloat(area) * squareMetersToHectares).toFixed(4)) || 0
