import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/**/*.test.{ts,tsx}',
      'tests/**/*.spec.{ts,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      'build'
    ],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    isolate: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'client/src/**/*.{ts,tsx}',
        'server/**/*.ts',
        'shared/**/*.ts'
      ],
      exclude: [
        'tests/**',
        '**/*.d.ts',
        '**/*.config.{ts,js}',
        '**/node_modules/**',
        '**/dist/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    reporter: ['verbose', 'json'],
    outputFile: 'test-results.json'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../client/src'),
      '@shared': resolve(__dirname, '../shared'),
      '@server': resolve(__dirname, '../server'),
      '@tests': resolve(__dirname, '../tests')
    }
  },
  esbuild: {
    target: 'node18'
  }
});