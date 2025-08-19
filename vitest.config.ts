import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, './shared'),
      '@': resolve(__dirname, './client/src'),
      '@server': resolve(__dirname, './server'),
    },
  },
});