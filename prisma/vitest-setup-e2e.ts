import { env } from '@/@env';
import { prisma } from '@/lib/prisma';
import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const schema = randomUUID();
const databaseUrl = (() => {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const url = new URL(env.DATABASE_URL);
  url.searchParams.set('schema', schema);
  return url.toString();
})();

env.DATABASE_URL = databaseUrl;

execSync('npx prisma migrate deploy');

// Cleanup after all tests
afterAll(async () => {
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await prisma.$disconnect();
});