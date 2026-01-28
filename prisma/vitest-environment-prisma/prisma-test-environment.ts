import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { Environment } from 'vitest/environments';

function generateDatabaseUrl(schemaName: string) {
  const baseUrl =
    process.env.DATABASE_URL ||
    'postgresql://docker:docker@localhost:5432/apiopensea?schema=public';

  const url = new URL(baseUrl);
  url.searchParams.set('schema', schemaName);
  return url.toString();
}

export default <Environment>{
  name: 'prisma',
  transformMode: 'ssr',
  async setup() {
    const schema = `test_${randomUUID().replace(/-/g, '_')}`;

    // Salva a URL original ANTES de sobrescrever
    const originalDatabaseUrl =
      process.env.DATABASE_URL ||
      'postgresql://docker:docker@localhost:5432/apiopensea?schema=public';

    const databaseUrl = generateDatabaseUrl(schema);

    // Define a URL ANTES de qualquer código do app ser importado
    process.env.DATABASE_URL = databaseUrl;

    // Aplica as migrations no schema de teste isolado
    execSync('npx prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
    });

    console.log(`🧪 Environment Prisma: usando schema ${schema}`);

    return {
      async teardown() {
        const { PrismaClient } = await import('../generated/prisma/client.js');
        const { PrismaPg } = await import('@prisma/adapter-pg');

        // Conecta ao schema público para dropar o schema de teste
        const adapter = new PrismaPg({ connectionString: originalDatabaseUrl });
        const prisma = new PrismaClient({ adapter });

        try {
          await prisma.$executeRawUnsafe(
            `DROP SCHEMA IF EXISTS "${schema}" CASCADE`,
          );
          console.log(`🧹 Schema ${schema} removido`);
        } catch (error) {
          console.error(`❌ Erro ao remover schema ${schema}:`, error);
        } finally {
          await prisma.$disconnect();
        }
      },
    };
  },
};
