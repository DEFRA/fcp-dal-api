import {
  booleanise,
  transformAddress,
  transformEntityStatus
} from '../../../app/transformers/common.js'

describe('Common transformers', () => {
  describe('Address transformer', () => {
    const address = {
      address1: 'line1',
      address2: 'line2',
      address3: 'line3',
      address4: 'line4',
      address5: 'line5',
      pafOrganisationName: 'paf organisation name',
      buildingNumberRange: 'building number range',
      buildingName: 'building name',
      flatName: 'flat name',
      street: 'street',
      city: 'city',
      county: 'county',
      postalCode: 'postal code',
      country: 'country',
      uprn: 'uprn',
      dependentLocality: 'dependent locality',
      doubleDependentLocality: 'double dependent locality',
      addressTypeId: 'address type'
    }

    it('should fill address with supplied fields', () => {
      expect(transformAddress(address)).toEqual({
        line1: 'line1',
        line2: 'line2',
        line3: 'line3',
        line4: 'line4',
        line5: 'line5',
        pafOrganisationName: 'paf organisation name',
        buildingNumberRange: 'building number range',
        buildingName: 'building name',
        flatName: 'flat name',
        street: 'street',
        city: 'city',
        county: 'county',
        postalCode: 'postal code',
        country: 'country',
        uprn: 'uprn',
        dependentLocality: 'dependent locality',
        doubleDependentLocality: 'double dependent locality',
        typeId: 'address type'
      })
    })
  })

  describe('Entity status transformer', () => {
    const entity = {
      locked: true,
      deactivated: false,
      confirmed: true
    }

    it('should transform entity status correctly', () => {
      expect(transformEntityStatus(entity)).toEqual({
        locked: true,
        deactivated: false,
        confirmed: true
      })
    })
  })

  describe('booleanise function', () => {
    it('should return true for truthy values', () => {
      expect(booleanise(true)).toBe(true)
      expect(booleanise(1)).toBe(true)
      expect(booleanise('yes')).toBe(true)
    })

    it('should return false for falsy values', () => {
      expect(booleanise(false)).toBe(false)
      expect(booleanise(0)).toBe(false)
      expect(booleanise(null)).toBe(false)
      expect(booleanise(undefined)).toBe(false)
    })
  })
})
