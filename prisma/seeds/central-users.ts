import type { PrismaClient } from '../generated/prisma/client.js';

export async function seedCentralUsers(prisma: PrismaClient) {
  console.log('\n👑 Sincronizando usuários centrais...');

  const superAdmins = await prisma.user.findMany({
    where: { isSuperAdmin: true, deletedAt: null },
    select: { id: true, email: true },
  });

  if (superAdmins.length === 0) {
    console.log('   ⚠️ Nenhum super admin encontrado, pulando central users');
    return;
  }

  let createdCount = 0;

  for (const admin of superAdmins) {
    const existing = await prisma.centralUser.findUnique({
      where: { userId: admin.id },
    });

    if (!existing) {
      await prisma.centralUser.create({
        data: {
          userId: admin.id,
          role: 'OWNER',
        },
      });
      createdCount++;
    }

    console.log(`   ✅ ${admin.email} → CentralUser (OWNER)`);
  }

  console.log(
    `   ✅ ${createdCount} criados, ${superAdmins.length - createdCount} já existiam`,
  );
}
