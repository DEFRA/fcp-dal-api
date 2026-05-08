/**
 * Retries a callback until it passes or the timeout expires.
 * The function passes if it completes without throwing an error, no return value is
 * expected, or asserted against.
 *
 * @param callbackFunction function to call.
 * @param timeout the maximum length of time (in milliseconds) to wait for a response
 * @param interval the number of milliseconds between retry events
 */

export const waitFor = async (callbackFunction, { timeout = 5000, interval = 200 } = {}) => {
  const deadline = Date.now() + timeout
  let lastError
  while (Date.now() < deadline) {
    try {
      return await callbackFunction()
    } catch (err) {
      lastError = err
      await new Promise((resolve) => setTimeout(resolve, interval))
    }
  }
  throw lastError
}
