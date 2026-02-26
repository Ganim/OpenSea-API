import path from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [path.resolve(__dirname, 'prisma/vitest-setup-e2e.ts')],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    testTimeout: 30000,
    hookTimeout: 300000,
    include: [
      'src/**/*.e2e.spec.ts',
      'src/**/*.e2e-spec.ts',
      'src/http/controllers/auth/*.spec.ts',
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
});
