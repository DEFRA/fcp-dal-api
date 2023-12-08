import { Authorize } from '../../app/auth/authorize'
import { Unauthorized } from '../../app/errors/graphql'

describe('Authorize', () => {
  const adminGroupId = process.env.ADMIN_AD_GROUP_ID

  it('isAdmin should return true when user is an admin', () => {
    const authorize = new Authorize({ adGroups: [adminGroupId] })
    expect(authorize.isAdmin()).toBe(true)
  })

  it('isAdmin should return false when user is not an admin', () => {
    const authorize = new Authorize({ adGroups: ['other-group-id'] })
    expect(authorize.isAdmin()).toBe(undefined)
  })

  it('checkAuthGroup should not throw an error for admins with correct group', () => {
    const authorize = new Authorize({ adGroups: [adminGroupId] })
    const testGroup = 'ADMIN'
    expect(() => authorize.checkAuthGroup(testGroup)).not.toThrow()
  })

  it('checkAuthGroup should throw Unauthorized when user is not an admin', () => {
    const authorize = new Authorize({ adGroups: ['other-group-id'] })
    const testGroup = 'ADMIN'
    expect(() => authorize.checkAuthGroup(testGroup)).toThrow(Unauthorized)
  })

  it('checkAuthGroup should throw Unauthorized when user is not in specified AD group', () => {
    const authorize = new Authorize({ adGroups: [adminGroupId] })
    const testGroup = 'NON_EXISTENT_GROUP'
    expect(() => authorize.checkAuthGroup(testGroup)).toThrow(Unauthorized)
  })
})
