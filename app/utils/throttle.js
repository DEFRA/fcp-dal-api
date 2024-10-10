import { setTimeout } from 'node:timers/promises'

export const throttle = (fn, time) => {
  let shouldThrottle = false
  let success = true
  return async (...args) => {
    if (!shouldThrottle) {
      shouldThrottle = true
      try {
        await fn(...args)
      } catch (error) {
        success = false
      }
      setTimeout(time).then(() => {
        shouldThrottle = false
      })
      return success
    } else {
      return success
    }
  }
}
