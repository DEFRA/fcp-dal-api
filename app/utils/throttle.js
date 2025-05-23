export const throttle = (fn, time) => {
  let shouldThrottle = false
  let success = true
  return async (...args) => {
    if (!shouldThrottle) {
      shouldThrottle = true
      success = await fn(...args)
      setTimeout(() => {
        shouldThrottle = false
      }, time)
      return success
    } else {
      return success
    }
  }
}
