import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { Environment } from 'vitest/environments';

function generateDatabaseUrl(schemaName: string) {
  const baseUrl =
    process.env.DATABASE_URL ||
    'postgresql://docker:docker@localhost:5432/opensea-db?schema=public';

  const url = new URL(baseUrl);
  url.searchParams.set('schema', schemaName);
  return url.toString();
}

export default <Environment>{
  name: 'prisma',
  transformMode: 'ssr',
  async setup() {
    const schema = `test_${randomUUID().replace(/-/g, '_')}`;
    const databaseUrl = generateDatabaseUrl(schema);

    // Define a URL ANTES de qualquer código do app ser importado
    process.env.DATABASE_URL = databaseUrl;

    // Primeiro, conecta ao banco base para dropar enums globais se existirem
    const baseUrl = process.env.DATABASE_URL || 'postgresql://docker:docker@localhost:5432/opensea-db?schema=public';
    const { PrismaClient } = await import('@prisma/client');
    const basePrisma = new PrismaClient({
      datasources: { db: { url: baseUrl } },
    });

    try {
      // Drop enums globais que podem conflitar
      await basePrisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "Role" CASCADE`);
      console.log('🧹 Enums globais removidos');
    } catch (error) {
      console.error('❌ Erro ao remover enums globais:', error);
    } finally {
      await basePrisma.$disconnect();
    }

    execSync('npx prisma db push --force-reset', {
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
    });

    console.log(`🧪 Environment Prisma: usando schema ${schema}`);

    return {
      async teardown() {
        // Importa dinamicamente para usar a URL correta
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient({
          datasources: { db: { url: databaseUrl } },
        });

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
