import { gql, GraphQLClient } from 'graphql-request'
import jwt from 'jsonwebtoken'

const targetURL = process.env.TARGET_URL ?? 'http://localhost:3000/graphql'

describe('Permission Groups quueries', () => {
  const client = new GraphQLClient(targetURL)
  const permissionGroupsQuery = gql`
    query PermissionGroups($sbi: ID!, $crn: ID!) {
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

  it('resolves a permission groups query - internal', async () => {
    const response = await client.request(
      permissionGroupsQuery,
      { crn: '1111122200', sbi: '222222222' },
      { email: 'some-email' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.permissionGroups.length).toBeGreaterThan(0)
    expect(Object.keys(response.permissionGroups[0])).toEqual(['id', 'name', 'permissions'])
    expect(Object.keys(response.permissionGroups[0].permissions[0])).toEqual([
      'level',
      'functions',
      'active'
    ])
  })

  it('resolves a permission groups query - external', async () => {
    const tokenValue = jwt.sign(
      {
        contactId: '1111122200',
        relationships: ['222222222:222222222']
      },
      'test-secret'
    )
    const response = await client.request(
      permissionGroupsQuery,
      { crn: '1111122200', sbi: '222222222' },
      { email: 'some-email' },
      { 'x-forwarded-authorization': tokenValue }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.permissionGroups.length).toBeGreaterThan(0)
    expect(Object.keys(response.permissionGroups[0])).toEqual(['id', 'name', 'permissions'])
    expect(Object.keys(response.permissionGroups[0].permissions[0])).toEqual([
      'level',
      'functions',
      'active'
    ])
  })
})
