export const mockOrganisationSearch = (nockInstance, orgId = 'organisationId') => {
  nockInstance
    .post('/organisation/search', {
      searchFieldType: 'SBI',
      primarySearchPhrase: '123456789',
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

export const mockPersonSearch = (nockInstance, crn = '1234567890') => {
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
