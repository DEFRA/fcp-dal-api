import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { config } from '../../../app/config.js'
import { CACHE_COLLECTIONS, db, ensureTtlIndexes } from '../../../app/mongo.js'

describe('ensureTtlIndexes', () => {
  let createIndexes

  beforeEach(() => {
    createIndexes = {
      customers: vi.fn().mockResolvedValue('updatedAt_ttl'),
      businesses: vi.fn().mockResolvedValue('updatedAt_ttl')
    }
    vi.spyOn(db, 'collection').mockImplementation((name) => ({
      createIndex: createIndexes[name]
    }))
    vi.spyOn(db, 'command').mockResolvedValue({ ok: 1 })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a 24 hour TTL index on updatedAt for customers and businesses by default', async () => {
    await ensureTtlIndexes()

    expect(CACHE_COLLECTIONS).toEqual(['customers', 'businesses'])
    for (const name of CACHE_COLLECTIONS) {
      expect(createIndexes[name]).toHaveBeenCalledWith(
        { updatedAt: 1 },
        { name: 'updatedAt_ttl', expireAfterSeconds: 86400 }
      )
    }
    expect(db.command).not.toHaveBeenCalled()
  })

  it('uses a separate configured TTL per collection', async () => {
    const getConfig = config.get.bind(config)
    vi.spyOn(config, 'get').mockImplementation((key) => {
      if (key === 'mongo.cacheTtlSeconds.customers') return 3600
      if (key === 'mongo.cacheTtlSeconds.businesses') return 7200
      return getConfig(key)
    })

    await ensureTtlIndexes()

    expect(createIndexes.customers).toHaveBeenCalledWith(
      { updatedAt: 1 },
      { name: 'updatedAt_ttl', expireAfterSeconds: 3600 }
    )
    expect(createIndexes.businesses).toHaveBeenCalledWith(
      { updatedAt: 1 },
      { name: 'updatedAt_ttl', expireAfterSeconds: 7200 }
    )
  })

  it.each([85, 86])(
    'updates the TTL via collMod when an index conflict (code %i) occurs',
    async (code) => {
      const conflict = Object.assign(new Error('conflict'), { code })
      createIndexes.customers.mockRejectedValue(conflict)
      createIndexes.businesses.mockRejectedValue(conflict)

      await ensureTtlIndexes()

      for (const collMod of CACHE_COLLECTIONS) {
        expect(db.command).toHaveBeenCalledWith({
          collMod,
          index: { name: 'updatedAt_ttl', expireAfterSeconds: 86400 }
        })
      }
    }
  )

  it('rethrows non-conflict errors', async () => {
    createIndexes.customers.mockRejectedValue(Object.assign(new Error('boom'), { code: 13 }))

    await expect(ensureTtlIndexes()).rejects.toThrow('boom')
    expect(db.command).not.toHaveBeenCalled()
  })
})
