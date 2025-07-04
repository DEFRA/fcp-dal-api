import { transformAddress } from '../../../app/utils/common.js'

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
