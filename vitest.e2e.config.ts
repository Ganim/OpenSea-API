import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [path.resolve(__dirname, 'prisma/vitest-setup-e2e.ts')],
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
