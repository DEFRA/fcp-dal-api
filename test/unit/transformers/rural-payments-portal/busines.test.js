import { transformOrganisationToBusiness } from '../../../../app/transformers/rural-payments/business.js'
import { organisationByOrgId } from '../../../fixtures/organisation.js'

describe('Business transformer', () => {
  test('transformOrganisationToBusiness', () => {
    const { _data: organisation } = organisationByOrgId(5565448)

    expect(transformOrganisationToBusiness(organisation)).toEqual({
      organisationId: '5565448',
      info: {
        address: {
          line1: '76 Robinswood Road',
          line2: 'UPPER CHUTE',
          line3: 'Child Okeford',
          line4: null,
          line5: null,
          buildingName: 'STOCKWELL HALL',
          buildingNumberRange: '7',
          city: 'DARLINGTON',
          country: 'United Kingdom',
          county: 'Dorset',
          dependentLocality: 'ELLICOMBE',
          doubleDependentLocality: 'WOODTHORPE',
          flatName: 'THE COACH HOUSE',
          pafOrganisationName: 'FORTESCUE ESTATES',
          postalCode: 'CO9 3LS',
          street: 'HAREWOOD AVENUE',
          typeId: null,
          uprn: '10008695234'
        },
        email: {
          address: 'henleyrej@eryelnehk.com.test',
          doNotContact: false,
          validated: true
        },
        legalStatus: { code: 102111, type: 'Sole Proprietorship' },
        name: 'HENLEY, RE',
        phone: { fax: null, landline: '01234031859', mobile: null },
        reference: '1102179604',
        registrationNumbers: { charityCommission: null, companiesHouse: null },
        traderNumber: '010203040506070880980',
        type: { code: 101443, type: 'Not Specified' },
        vat: 'GB123456789',
        vendorNumber: '694523'
      },
      sbi: '107183280'
    })
  })

  test('transformOrganisationToBusiness', () => {
    const { _data: organisation } = organisationByOrgId(5625145)

    expect(transformOrganisationToBusiness(organisation)).toEqual({
      organisationId: '5625145',
      info: {
        address: {
          line1: 'Estate Office',
          line2: 'Crawley',
          line3: null,
          line4: null,
          line5: null,
          buildingName: 'LADYWOOD LODGE FARM',
          buildingNumberRange: null,
          city: 'ALNWICK',
          country: 'United Kingdom',
          county: null,
          dependentLocality: 'LAVANT',
          doubleDependentLocality: null,
          flatName: null,
          pafOrganisationName: null,
          postalCode: 'BD5 9NR',
          street: 'BARTINDALE ROAD',
          typeId: null,
          uprn: '100010079050'
        },
        email: {
          address: 'cliffspencetasabbeyfarmf@mrafyebbasatecnepsffilcm.com.test',
          doNotContact: false,
          validated: true
        },
        legalStatus: { code: 102108, type: 'Partnership' },
        name: "Cliff Spence Teritorial Army's Abbey Farm, Hop-Worthering on the Naze a.k.a. the Donkey Sanctuary",
        phone: { fax: null, landline: null, mobile: '01234031670' },
        reference: '1102698830',
        registrationNumbers: { charityCommission: null, companiesHouse: null },
        traderNumber: null,
        type: { code: 101422, type: 'Land Manager' },
        vat: null,
        vendorNumber: '284495G'
      },
      sbi: '107591843'
    })
  })
})
