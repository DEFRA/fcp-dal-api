import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/acceptance/**/*.test.js'],
    setupFiles: ['dotenv/config']
  }
})
