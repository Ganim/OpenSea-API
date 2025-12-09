import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { afterAll } from 'vitest';

// Gera schema único ANTES de qualquer importação do app
const schema = `test_${randomUUID().replace(/-/g, '_')}`;

function generateDatabaseUrl(schemaName: string) {
  const baseUrl =
    process.env.DATABASE_URL ||
    'postgresql://docker:docker@localhost:5432/opensea-db?schema=public';

  const url = new URL(baseUrl);
  url.searchParams.set('schema', schemaName);
  return url.toString();
}

// Define a URL do banco ANTES de importar qualquer módulo do app
const testDatabaseUrl = generateDatabaseUrl(schema);
process.env.DATABASE_URL = testDatabaseUrl;

// Aplica as migrations no schema de teste
execSync('npx prisma migrate deploy', {
  env: {
    ...process.env,
    DATABASE_URL: testDatabaseUrl,
  },
});

console.log(`🧪 Testes E2E usando schema: ${schema}`);

// Cleanup após todos os testes do arquivo
afterAll(async () => {
  // Importa o prisma apenas no cleanup para garantir que use a URL correta
  const { prisma } = await import('@/lib/prisma');

  try {
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    console.log(`🧹 Schema ${schema} removido com sucesso`);
  } catch (error) {
    console.error(`❌ Erro ao remover schema ${schema}:`, error);
  } finally {
    await prisma.$disconnect();
  }
});