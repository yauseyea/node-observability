import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/index.ts', // entry point — no unit logic
        'src/tracing.ts', // no real logic
        'src/profiling.ts', // no real logic
      ],
    },
    // Prevent Pyroscope/OTel from actually starting during tests
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});
