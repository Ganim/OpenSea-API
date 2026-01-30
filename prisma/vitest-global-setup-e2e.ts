import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { GlobalSetupContext } from 'vitest/node';

const schema = `test_${randomUUID().replace(/-/g, '_')}`;

const originalDatabaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://docker:docker@localhost:5432/apiopensea?schema=public';

function generateTestDatabaseUrl() {
  const url = new URL(originalDatabaseUrl);
  url.searchParams.set('schema', schema);
  return url.toString();
}

export async function setup({ provide }: GlobalSetupContext) {
  const testDatabaseUrl = generateTestDatabaseUrl();

  // Define a URL de teste no processo principal - herdada pelos forks
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.NODE_ENV = 'test';
  process.env.SILENCE_RATE_LIMIT_LOGS = '1';

  // Aplica as migrations no schema de teste
  execSync('npx prisma migrate deploy', {
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
    },
  });

  console.log(`\n🧪 E2E Global Setup: schema ${schema}\n`);
}

export async function teardown() {
  const { PrismaClient } = await import('./generated/prisma/client.js');
  const { PrismaPg } = await import('@prisma/adapter-pg');

  // Conecta ao schema público para dropar o schema de teste
  const adapter = new PrismaPg({ connectionString: originalDatabaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$executeRawUnsafe(
      `DROP SCHEMA IF EXISTS "${schema}" CASCADE`,
    );
    console.log(`\n🧹 Schema ${schema} removido com sucesso\n`);
  } catch (error) {
    console.error(`\n❌ Erro ao remover schema ${schema}:`, error);
  } finally {
    await prisma.$disconnect();
  }
}
