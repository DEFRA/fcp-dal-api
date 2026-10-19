// The Vitest global setup exposes the test database as MONGO_URL.
process.env.MONGO_URI = process.env.MONGO_URL
// Isolate each Vitest worker in its own database so test files can run in parallel.
process.env.MONGO_DATABASE = `fcp-dal-api-${process.env.VITEST_POOL_ID}`
