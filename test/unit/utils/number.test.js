import { convertSquareMetersToHectares } from '../../../app/utils/numbers'

describe('#convertSquareMetersToHectares', () => {
  it('should convert square meters to hectares', () => {
    expect(convertSquareMetersToHectares(10_000)).toBe(1)
    expect(convertSquareMetersToHectares(5_000)).toBe(0.5)
    expect(convertSquareMetersToHectares(0)).toBe(0)
    expect(convertSquareMetersToHectares(10_000.1)).toBe(1) // should round down sensibly
    expect(convertSquareMetersToHectares(10_000.9)).toBe(1.0001) //should round up sensibly
    expect(convertSquareMetersToHectares('10000')).toBe(1) // string input
  })

  it('should handle invalid inputs gracefully', () => {
    expect(convertSquareMetersToHectares(null)).toBe(0) // null input
    expect(convertSquareMetersToHectares(undefined)).toBe(0) // undefined input
    expect(convertSquareMetersToHectares('invalid')).toBe(0) // non-numeric string
  })
})
