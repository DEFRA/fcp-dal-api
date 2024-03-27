import { faker } from '@faker-js/faker/locale/en_GB'

const createSitiAgriAuthorisationOrganisation = (attributes = {}) => {
  const personId = attributes.organisationId ? `${attributes.organisationId}` : faker.string.numeric(7)
  return {
    personRoles: [
      {
        personId,
        role: 'Business Partner'
      }
    ],
    personPrivileges: [
      {
        personId,
        privilegeNames: ['Full permission - business']
      },
      {
        personId,
        privilegeNames: ['SUBMIT - CS APP - SA']
      },
      {
        personId,
        privilegeNames: ['SUBMIT - CS AGREE - SA']
      },
      {
        personId,
        privilegeNames: ['Amend - land']
      },
      {
        personId,
        privilegeNames: ['Amend - entitlement']
      },
      {
        personId,
        privilegeNames: ['Submit - bps']
      },
      {
        personId,
        privilegeNames: ['SUBMIT - BPS - SA']
      },
      {
        personId,
        privilegeNames: ['AMEND - ENTITLEMENT - SA']
      },
      {
        personId,
        privilegeNames: ['AMEND - LAND - SA']
      },
      {
        personId,
        privilegeNames: ['Submit - cs app']
      },
      {
        personId,
        privilegeNames: ['Submit - cs agree']
      },
      {
        personId,
        privilegeNames: ['ELM_APPLICATION_SUBMIT']
      }
    ]
  }
}

export const sitiAgriAuthorisationOrganisation = (attributes = {}) => {
  if (attributes.organisationId) {
    faker.seed(+attributes.organisationId)
  }

  return createSitiAgriAuthorisationOrganisation(attributes)
}
