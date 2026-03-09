import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// Carrega as variáveis do .env (sem prefixo = todas as vars)
const envVars = loadEnv('', process.cwd(), '');

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    dir: 'src',
    include: ['**/*.spec.ts', '**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/use-cases/**', 'src/entities/**', 'src/services/**'],
      exclude: ['**/node_modules/**', '**/*.spec.ts', '**/*.e2e.spec.ts', '**/factories/**'],
      thresholds: {
        lines: 70,
        functions: 65,
        branches: 60,
        statements: 70,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: [
            'src/use-cases/**/*.spec.ts',
            'src/entities/**/*.spec.ts',
            'src/repositories/**/*.spec.ts',
          ],
          exclude: ['**/*.e2e.spec.ts', '**/*.e2e-spec.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'e2e',
          dir: 'src/http/controllers',
          include: ['**/*.e2e.spec.ts', '**/*.e2e-spec.ts'],
          exclude: [],
          setupFiles: ['./prisma/vitest-setup-e2e.ts'],
          env: {
            ...envVars,
            NODE_ENV: 'test',
          },
          // singleFork: true → todos os specs compartilham um único processo fork.
          // O app Fastify é inicializado UMA vez pelo primeiro spec; specs
          // subsequentes chamam app.ready() e retornam instantaneamente (já pronto).
          // Isso evita cold-start de TypeScript/Fastify em cada spec (~130s/spec).
          //
          // execArgv: --stack-size=16384 → aumenta o stack do V8 de ~1MB para 16MB.
          // Necessário pois o Fastify com ~450+ plugins causa stack overflow durante
          // a inicialização recursiva via avvio/fastq. Com stack grande, pluginTimeout
          // pode ser definido (não-zero) para evitar hang eterno se algo falhar.
          //
          // fileParallelism: false → arquivos executam sequencialmente, evitando
          // contention do advisory lock do PostgreSQL no prisma migrate deploy.
          testTimeout: 30000,
          hookTimeout: 300000,
          pool: 'forks',
          poolOptions: {
            forks: {
              singleFork: true,
              execArgv: ['--stack-size=16384'],
            },
          },
          fileParallelism: false,
        },
      },
    ],
  },
});
