import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      vscode: path.resolve(__dirname, './tests/vscode-stub.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/core/**/*.{ts,tsx}',
        'src/services/**/*.{ts,tsx}',
        'src/utils/**/*.{ts,tsx}',
        'src/workspace/**/*.{ts,tsx}',
        'src/types/errors.ts',
        'src/types/filters.ts',
        'src/webview/messaging.ts',
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/webview/ui/main.tsx',
        'src/assets/**',
      ],
      thresholds: {
        statements: 70,
        branches: 65,
        functions: 70,
        lines: 70,
      },
    },
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
