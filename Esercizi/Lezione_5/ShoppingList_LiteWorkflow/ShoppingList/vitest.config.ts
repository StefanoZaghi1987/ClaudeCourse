import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@models': resolve(__dirname, 'src/models/index.ts'),
      '@db': resolve(__dirname, 'src/db/index.ts'),
      '@utils': resolve(__dirname, 'src/utils'),
    },
  },
  test: {
    environment: 'node',
    globals: false,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.ts'],
  },
});
