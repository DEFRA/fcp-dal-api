import { createAuditTrail, rootKeyFromInfoPath } from '../../../app/audit/audit-trail.js'

const pathTo = (key, prev) => ({ key, typename: undefined, prev })

describe('rootKeyFromInfoPath', () => {
  test('returns the key of a single-segment path', () => {
    const info = { path: pathTo('business', undefined) }
    expect(rootKeyFromInfoPath(info)).toBe('business')
  })

  test('walks a deeply nested path up to the root segment', () => {
    const rootSegment = pathTo('business', undefined)
    const paymentsSegment = pathTo('payments', rootSegment)
    const onHoldSegment = pathTo('onHold', paymentsSegment)
    const info = { path: onHoldSegment }

    expect(rootKeyFromInfoPath(info)).toBe('business')
  })

  test('returns undefined when info is missing', () => {
    expect(rootKeyFromInfoPath(undefined)).toBeUndefined()
  })

  test('returns undefined when info has no path', () => {
    expect(rootKeyFromInfoPath({})).toBeUndefined()
  })
})

describe('createAuditTrail', () => {
  describe('recordEntity', () => {
    test('records an entity under the root selection derived from info.path', () => {
      const auditTrail = createAuditTrail()
      const info = { path: pathTo('business', undefined) }

      auditTrail.recordEntity(info, { entity: 'payment-list', action: 'read', entityid: 'frn-1' })

      expect(auditTrail.getForRoot('business').entities).toEqual([
        { entity: 'payment-list', action: 'read', entityid: 'frn-1' }
      ])
    })

    test('accumulates multiple entities recorded under the same root selection', () => {
      const auditTrail = createAuditTrail()
      const info = { path: pathTo('business', undefined) }

      auditTrail.recordEntity(info, { entity: 'payment-list', action: 'read', entityid: 'frn-1' })
      auditTrail.recordEntity(info, { entity: 'bank-account', action: 'read', entityid: 'frn-1' })

      expect(auditTrail.getForRoot('business').entities).toEqual([
        { entity: 'payment-list', action: 'read', entityid: 'frn-1' },
        { entity: 'bank-account', action: 'read', entityid: 'frn-1' }
      ])
    })

    test('keeps entities recorded under different root selections separate', () => {
      const auditTrail = createAuditTrail()

      auditTrail.recordEntity(
        { path: pathTo('business1', undefined) },
        { entity: 'payment-list', action: 'read', entityid: 'frn-1' }
      )
      auditTrail.recordEntity(
        { path: pathTo('business2', undefined) },
        { entity: 'payment-list', action: 'read', entityid: 'frn-2' }
      )

      expect(auditTrail.getForRoot('business1').entities).toEqual([
        { entity: 'payment-list', action: 'read', entityid: 'frn-1' }
      ])
      expect(auditTrail.getForRoot('business2').entities).toEqual([
        { entity: 'payment-list', action: 'read', entityid: 'frn-2' }
      ])
    })

    test('is a no-op when the root selection cannot be determined', () => {
      const auditTrail = createAuditTrail()

      auditTrail.recordEntity({}, { entity: 'payment-list', action: 'read', entityid: 'frn-1' })

      expect(auditTrail.getForRoot(undefined).entities).toBeUndefined()
    })

    test('ignores properties other than entity, action and entityid', () => {
      const auditTrail = createAuditTrail()
      const info = { path: pathTo('business', undefined) }

      auditTrail.recordEntity(info, {
        entity: 'payment-list',
        action: 'read',
        entityid: 'frn-1',
        extra: 'should not be kept'
      })

      expect(auditTrail.getForRoot('business').entities).toEqual([
        { entity: 'payment-list', action: 'read', entityid: 'frn-1' }
      ])
    })
  })

  describe('recordAccount', () => {
    test('records an account value under the root selection derived from info.path', () => {
      const auditTrail = createAuditTrail()
      const info = { path: pathTo('business', undefined) }

      auditTrail.recordAccount(info, 'frn', '123456789')

      expect(auditTrail.getForRoot('business').accounts).toEqual({ frn: '123456789' })
    })

    test('coerces the recorded value to a string', () => {
      const auditTrail = createAuditTrail()
      const info = { path: pathTo('business', undefined) }

      auditTrail.recordAccount(info, 'organisationId', 123456789)

      expect(auditTrail.getForRoot('business').accounts).toEqual({ organisationId: '123456789' })
    })

    test('ignores a null or undefined value', () => {
      const auditTrail = createAuditTrail()
      const info = { path: pathTo('business', undefined) }

      auditTrail.recordAccount(info, 'frn', null)
      auditTrail.recordAccount(info, 'crn', undefined)

      expect(auditTrail.getForRoot('business').accounts).toBeUndefined()
    })

    test('is a no-op when the root selection cannot be determined', () => {
      const auditTrail = createAuditTrail()

      auditTrail.recordAccount({}, 'frn', '123456789')

      expect(auditTrail.getForRoot(undefined).accounts).toBeUndefined()
    })

    test('accumulates different account names recorded under the same root selection', () => {
      const auditTrail = createAuditTrail()
      const info = { path: pathTo('business', undefined) }

      auditTrail.recordAccount(info, 'frn', '6561479446')
      auditTrail.recordAccount(info, 'sbi', '123456789')

      expect(auditTrail.getForRoot('business').accounts).toEqual({
        frn: '6561479446',
        sbi: '123456789'
      })
    })

    test('a later recording of the same account name overwrites an earlier one', () => {
      const auditTrail = createAuditTrail()
      const info = { path: pathTo('business', undefined) }

      auditTrail.recordAccount(info, 'frn', 'first')
      auditTrail.recordAccount(info, 'frn', 'second')

      expect(auditTrail.getForRoot('business').accounts).toEqual({ frn: 'second' })
    })

    test('records a falsy-but-valid value such as 0', () => {
      const auditTrail = createAuditTrail()
      const info = { path: pathTo('business', undefined) }

      auditTrail.recordAccount(info, 'personId', 0)

      expect(auditTrail.getForRoot('business').accounts).toEqual({ personId: '0' })
    })

    test('records a falsy-but-valid value such as an empty string', () => {
      const auditTrail = createAuditTrail()
      const info = { path: pathTo('business', undefined) }

      auditTrail.recordAccount(info, 'vendor', '')

      expect(auditTrail.getForRoot('business').accounts).toEqual({ vendor: '' })
    })
  })

  describe('recordServiceAccount / serviceAccount', () => {
    test('returns the client supplied service account if present in the authContext', () => {
      const auditTrail = createAuditTrail({ serviceAccount: 'service-account@example.com' })

      expect(auditTrail.serviceAccount()).toBe('service-account@example.com')
    })

    test('returns undefined if no service account supplied', () => {
      const auditTrail = createAuditTrail()

      expect(auditTrail.serviceAccount()).toBeUndefined()
    })

    test('returns the recorded service account value', () => {
      const auditTrail = createAuditTrail()

      auditTrail.recordServiceAccount('service-account@example.com')

      expect(auditTrail.serviceAccount()).toBe('service-account@example.com')
    })

    test('a later recording overwrites an earlier one', () => {
      const auditTrail = createAuditTrail()

      auditTrail.recordServiceAccount('first@example.com')
      auditTrail.recordServiceAccount('second@example.com')

      expect(auditTrail.serviceAccount()).toBe('second@example.com')
    })
  })

  describe('getForRoot', () => {
    test('returns undefined entities and accounts for a root nothing was recorded under', () => {
      const auditTrail = createAuditTrail()

      expect(auditTrail.getForRoot('business')).toEqual({
        entities: undefined,
        accounts: undefined
      })
    })

    test('returns recorded entities alongside undefined accounts when only entities were recorded', () => {
      const auditTrail = createAuditTrail()
      const info = { path: pathTo('business', undefined) }

      auditTrail.recordEntity(info, { entity: 'payment-list', action: 'read', entityid: 'frn-1' })

      expect(auditTrail.getForRoot('business')).toEqual({
        entities: [{ entity: 'payment-list', action: 'read', entityid: 'frn-1' }],
        accounts: undefined
      })
    })

    test('returns recorded accounts alongside undefined entities when only accounts were recorded', () => {
      const auditTrail = createAuditTrail()
      const info = { path: pathTo('business', undefined) }

      auditTrail.recordAccount(info, 'frn', '6561479446')

      expect(auditTrail.getForRoot('business')).toEqual({
        entities: undefined,
        accounts: { frn: '6561479446' }
      })
    })
  })

  describe('rootKeys', () => {
    test('returns an empty array when nothing has been recorded', () => {
      const auditTrail = createAuditTrail()

      expect(auditTrail.rootKeys()).toEqual([])
    })

    test('returns each root selection something was recorded under, in first-recorded order', () => {
      const auditTrail = createAuditTrail()

      auditTrail.recordAccount({ path: pathTo('business2', undefined) }, 'sbi', '222')
      auditTrail.recordEntity(
        { path: pathTo('business1', undefined) },
        { entity: 'payment-list', action: 'read', entityid: 'frn-1' }
      )

      expect(auditTrail.rootKeys()).toEqual(['business2', 'business1'])
    })

    test('does not repeat a root selection recorded under more than once', () => {
      const auditTrail = createAuditTrail()
      const info = { path: pathTo('business', undefined) }

      auditTrail.recordAccount(info, 'sbi', '123456789')
      auditTrail.recordEntity(info, { entity: 'payment-list', action: 'read', entityid: 'frn-1' })

      expect(auditTrail.rootKeys()).toEqual(['business'])
    })
  })

  test('separate createAuditTrail() instances do not share state', () => {
    const first = createAuditTrail()
    const second = createAuditTrail()
    const info = { path: pathTo('business', undefined) }

    first.recordAccount(info, 'frn', '6561479446')
    first.recordEntity(info, { entity: 'payment-list', action: 'read', entityid: 'frn-1' })
    first.recordServiceAccount('service-account@example.com')

    expect(second.getForRoot('business')).toEqual({ entities: undefined, accounts: undefined })
    expect(second.serviceAccount()).toBeUndefined()
  })
})
