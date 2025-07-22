export const mockOrganisationSearch = (nockInstance, orgId = 'organisationId') => {
  nockInstance
    .post('/organisation/search', {
      searchFieldType: 'SBI',
      primarySearchPhrase: 'sbi',
      offset: 0,
      limit: 1
    })
    .reply(200, {
      _data: [
        {
          id: orgId
        }
      ]
    })
}

export const mockPersonSearch = (nockInstance, crn = 'crn') => {
  nockInstance
    .post('/person/search', {
      searchFieldType: 'CUSTOMER_REFERENCE',
      primarySearchPhrase: crn,
      offset: 0,
      limit: 1
    })
    .reply(200, {
      _data: [
        {
          id: 'personId'
        }
      ]
    })
}
