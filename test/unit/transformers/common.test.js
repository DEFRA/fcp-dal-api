import {
  booleanise,
  dalAddressToKitsAddress,
  kitsAddressToDalAddress,
  transformEntityStatus,
  transformToISODate
} from '../../../app/transformers/common.js'

describe('Common transformers', () => {
  describe('Address transformer', () => {
    const kitsAddress = {
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

    const dalAddress = {
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
    }

    it('should fill dal address with supplied fields', () => {
      expect(kitsAddressToDalAddress(kitsAddress)).toEqual(dalAddress)
    })

    it('should fill kits address with supplied fields', () => {
      expect(dalAddressToKitsAddress(dalAddress)).toEqual(kitsAddress)
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

  describe('transformToISODate', () => {
    it('should return iso string for valid values', () => {
      expect(transformToISODate('1752246672000')).toBe('2025-07-11T15:11:12.000Z')
      expect(transformToISODate('2025-07-11T15:11:12.000Z')).toBe('2025-07-11T15:11:12.000Z')
      expect(transformToISODate(1752246672000)).toBe('2025-07-11T15:11:12.000Z')
    })

    it('should null for invalid values', () => {
      expect(transformToISODate('')).toBe(null)
      expect(transformToISODate('2025-13-45T00:00:00.000Z')).toBe(null)
      expect(transformToISODate('abc')).toBe(null)
      expect(transformToISODate([])).toBe(null)
      expect(transformToISODate({})).toBe(null)
      expect(transformToISODate(false)).toBe(null)
      expect(transformToISODate(NaN)).toBe(null)
      expect(transformToISODate(null)).toBe(null)
      expect(transformToISODate(true)).toBe(null)
      expect(transformToISODate(undefined)).toBe(null)
    })
  })
})
