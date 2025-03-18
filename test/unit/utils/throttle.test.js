import { afterAll, jest } from '@jest/globals'
import { throttle } from '../../../app/utils/throttle.js'

describe('throttle function', () => {
  jest.useFakeTimers()

  let mockFn
  let throttledFn

  beforeEach(() => {
    mockFn = jest.fn()
    throttledFn = throttle(mockFn, 1000) // Throttle for 1000ms
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('should call the function immediately if not throttled', async () => {
    await throttledFn('arg1')
    expect(mockFn).toHaveBeenCalledWith('arg1')
  })

  it('should not call the function again if in throttle period', async () => {
    await throttledFn('arg1')
    await throttledFn('arg2') // This call should be throttled

    // Advance timers 500ms - still within throttle period
    jest.advanceTimersByTime(500)
    await Promise.resolve() // Ensure pending promises, like setTimeout, resolve

    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('should call the function again after the throttle period', async () => {
    await throttledFn('arg1')

    // Ensure all pending setTimeout calls are executed
    jest.advanceTimersByTime(1000)

    await throttledFn('arg2') // This call should go through

    expect(mockFn).toHaveBeenCalledTimes(2)
    expect(mockFn).toHaveBeenCalledWith('arg2')
  })

  it('should return true if the function executes successfully', async () => {
    const result = await throttledFn('arg1')
    expect(result).toBe(true)
  })

  it('should return false if the function throws an error', async () => {
    const errorFn = jest.fn(() => {
      throw new Error('error')
    })
    const throttledErrorFn = throttle(errorFn, 1000)
    const result = await throttledErrorFn()
    expect(result).toBe(false)
  })
})
