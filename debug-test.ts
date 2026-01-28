import { PrismaClient } from './prisma/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl =
  'postgresql://docker:docker@localhost:5432/opensea-db?schema=test_debug_new';

const adapter = new PrismaPg({ connectionString: databaseUrl });

const prisma = new PrismaClient({
  adapter,
  log: ['query', 'error', 'info', 'warn'],
});

async function test() {
  try {
    // Criar um usuário de teste
    const user = await prisma.user.create({
      data: {
        email: 'test@test.com',
        password_hash: 'hash',
        username: 'testuser',
        failedLoginAttempts: 0,
        forcePasswordReset: false,
        profile: {
          create: {
            name: 'Test',
            surname: 'User',
          },
        },
      },
      include: { profile: true },
    });

    console.log('✅ Usuário criado:', user);

    // Buscar usuário
    const found = await prisma.user.findFirst({
      where: { email: 'test@test.com', deletedAt: null },
      include: { profile: true },
    });

    console.log('✅ Usuário encontrado:', found);
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
