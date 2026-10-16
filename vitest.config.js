import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['dotenv/config', './test/setup.js'],
    globalSetup: ['./test/vitest-global-setup.js'],
    mockReset: true,
    fileParallelism: false,
    server: {
      deps: {
        inline: [
          'graphql',
          '@graphql-tools/merge',
          '@graphql-tools/schema',
          '@graphql-tools/utils',
          'graphql-scalars',
          '@apollo/server'
        ]
      }
    },
    coverage: {
      provider: 'v8',
      include: ['app/**/*.js'],
      reportsDirectory: 'coverage',
      reporter: ['text-summary', 'lcov', 'json-summary', 'json'],
      thresholds: {
        branches: 95,
        functions: 95,
        lines: 95,
        statements: 95
      }
    }
  }
})
