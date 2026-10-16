import { describe, expect, it } from 'vitest'
import { gql, GraphQLClient } from 'graphql-request'

const targetURL = process.env.TARGET_URL ?? 'http://localhost:3000/graphql'

const permissionGroupsQuery = gql`
  query PermissionGroups($crn: ID!, $sbi: ID!) {
    permissionGroups {
      id
      name
      permissions {
        level
        functions
        active(crn: $crn, sbi: $sbi)
      }
    }
  }
`

// Groups and levels come from app/data-sources/static/permission-groups.json; `active` is the
// level CRN 1111111100 holds for SBI 111111111 in the mock (see customer/queries.test.js)
const permissionLevels = (levels, activeLevel) =>
  levels.map((level) => expect.objectContaining({ level, active: level === activeLevel }))

const permissionGroups = [
  {
    id: 'BASIC_PAYMENT_SCHEME',
    name: 'Basic payment scheme (BPS)',
    permissions: permissionLevels(['NO_ACCESS', 'VIEW', 'AMEND', 'SUBMIT'], 'SUBMIT')
  },
  {
    id: 'BUSINESS_DETAILS',
    name: 'Business details',
    permissions: permissionLevels(
      ['NO_ACCESS', 'VIEW', 'AMEND', 'MAKE_LEGAL_CHANGES', 'FULL_PERMISSION'],
      'FULL_PERMISSION'
    )
  },
  {
    id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS',
    name: 'Countryside Stewardship (Agreements)',
    permissions: permissionLevels(['NO_ACCESS', 'VIEW', 'AMEND', 'SUBMIT'], 'SUBMIT')
  },
  {
    id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS',
    name: 'Countryside Stewardship (Applications)',
    permissions: permissionLevels(['NO_ACCESS', 'VIEW', 'AMEND', 'SUBMIT'], 'SUBMIT')
  },
  {
    id: 'ENTITLEMENTS',
    name: 'Entitlements',
    permissions: permissionLevels(['NO_ACCESS', 'VIEW', 'AMEND'], 'AMEND')
  },
  {
    id: 'ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS',
    name: 'Environmental Land Management (Applications)',
    permissions: permissionLevels(['NO_ACCESS', 'VIEW', 'AMEND', 'SUBMIT'], 'SUBMIT')
  },
  {
    id: 'LAND_DETAILS',
    name: 'Land details',
    permissions: permissionLevels(['NO_ACCESS', 'VIEW', 'AMEND'], 'AMEND')
  }
]

describe('permissionGroups Query', () => {
  const client = new GraphQLClient(targetURL)

  it('should return every permission group with the level active for the customer and business', async () => {
    const response = await client.request(
      permissionGroupsQuery,
      { crn: '1111111100', sbi: '111111111' },
      { email: 'some-email' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.permissionGroups).toEqual(permissionGroups)
  })

  it('should return the functions for each permission level', async () => {
    const response = await client.request(
      permissionGroupsQuery,
      { crn: '1111111100', sbi: '111111111' },
      { email: 'some-email' }
    )

    const landDetails = response.permissionGroups.find(({ id }) => id === 'LAND_DETAILS')
    expect(landDetails.permissions).toEqual([
      { level: 'NO_ACCESS', functions: [], active: false },
      { level: 'VIEW', functions: ['View land, features and covers'], active: false },
      {
        level: 'AMEND',
        functions: [
          'View land, features and covers',
          'Amend land, features and covers',
          'Transfer land'
        ],
        active: true
      }
    ])
  })
})
