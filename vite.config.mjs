import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    dir: 'src',
    include: ['**/*.spec.ts', '**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.e2e.spec.ts'],
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/use-cases/**/*.spec.ts', 'src/entities/**/*.spec.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'e2e',
          dir: 'src/http/controllers',
          environment:
            './prisma/vitest-environment-prisma/prisma-test-environment.ts',
        },
      },
    ],
  },
});
