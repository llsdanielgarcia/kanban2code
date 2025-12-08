import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      vscode: path.resolve(__dirname, 'tests/mocks/vscode.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    deps: {
      inline: ['vscode'],
    },
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/webview/**/*.tsx'],
    },
  },
});
