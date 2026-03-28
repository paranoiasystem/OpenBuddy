import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@domain': resolve(__dirname, 'src/domain'),
      '@application': resolve(__dirname, 'src/application'),
      '@adapters': resolve(__dirname, 'src/adapters'),
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
  test: {
    name: 'e2e',
    environment: 'node',
    include: ['src/**/*.e2e.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    reporters: ['verbose'],
    globals: false,
    singleThread: true,
  },
})
