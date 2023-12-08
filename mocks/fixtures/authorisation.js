import { person } from './person.js'

export const sitiAgriApiAuthorisationOrganisation = {
  personRoles: [
    {
      personId: person.id,
      role: 'Business Partner'
    }
  ],
  personPrivileges: [
    {
      personId: person.id,
      privilegeNames: [
        'Full permission - business'
      ]
    },
    {
      personId: person.id,
      privilegeNames: [
        'SUBMIT - CS APP - SA'
      ]
    },
    {
      personId: person.id,
      privilegeNames: [
        'SUBMIT - CS AGREE - SA'
      ]
    },
    {
      personId: person.id,
      privilegeNames: [
        'Amend - land'
      ]
    },
    {
      personId: person.id,
      privilegeNames: [
        'Amend - entitlement'
      ]
    },
    {
      personId: person.id,
      privilegeNames: [
        'Submit - bps'
      ]
    },
    {
      personId: person.id,
      privilegeNames: [
        'SUBMIT - BPS - SA'
      ]
    },
    {
      personId: person.id,
      privilegeNames: [
        'AMEND - ENTITLEMENT - SA'
      ]
    },
    {
      personId: person.id,
      privilegeNames: [
        'AMEND - LAND - SA'
      ]
    },
    {
      personId: person.id,
      privilegeNames: [
        'Submit - cs app'
      ]
    },
    {
      personId: person.id,
      privilegeNames: [
        'Submit - cs agree'
      ]
    },
    {
      personId: person.id,
      privilegeNames: [
        'ELM_APPLICATION_SUBMIT'
      ]
    }
  ]
}
