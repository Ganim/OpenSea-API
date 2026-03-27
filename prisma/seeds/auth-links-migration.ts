/**
 * Data migration script for AuthLinks.
 *
 * Creates EMAIL AuthLinks for all existing users, CPF AuthLinks for employees
 * with user accounts, and default TenantAuthConfig for all tenants.
 *
 * Idempotent: safe to run multiple times.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function migrateAuthLinks(prisma: any) {
  console.log('🔗 Migrating auth links...');

  // 1. Create EMAIL AuthLinks for all existing users
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, email: true, password_hash: true },
  });

  let emailCreated = 0;
  for (const user of users) {
    if (!user.email || !user.password_hash) continue;

    const existing = await prisma.authLink.findFirst({
      where: {
        userId: user.id,
        provider: 'EMAIL',
        unlinkedAt: null,
      },
    });

    if (!existing) {
      await prisma.authLink.create({
        data: {
          userId: user.id,
          provider: 'EMAIL',
          identifier: user.email.toLowerCase(),
          credential: user.password_hash,
          status: 'ACTIVE',
        },
      });
      emailCreated++;
    }
  }
  console.log(`   ✅ Created ${emailCreated} EMAIL auth links`);

  // 2. Create CPF AuthLinks for employees with user accounts
  const employees = await prisma.employee.findMany({
    where: { userId: { not: null }, deletedAt: null },
    select: { userId: true, cpf: true, tenantId: true },
  });

  let cpfCreated = 0;
  for (const emp of employees) {
    if (!emp.userId || !emp.cpf) continue;

    const cpfClean = emp.cpf.replace(/[\.\-\/]/g, '');
    if (cpfClean.length !== 11) continue;

    const existing = await prisma.authLink.findFirst({
      where: {
        userId: emp.userId,
        provider: 'CPF',
        unlinkedAt: null,
      },
    });

    if (!existing) {
      const user = await prisma.user.findUnique({
        where: { id: emp.userId },
        select: { password_hash: true },
      });

      if (user?.password_hash) {
        await prisma.authLink.create({
          data: {
            userId: emp.userId,
            provider: 'CPF',
            identifier: cpfClean,
            credential: user.password_hash,
            status: 'ACTIVE',
          },
        });
        cpfCreated++;
      }
    }
  }
  console.log(`   ✅ Created ${cpfCreated} CPF auth links`);

  // 3. Create default TenantAuthConfig for all tenants
  const tenants = await prisma.tenant.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });

  let configCreated = 0;
  for (const tenant of tenants) {
    const existing = await prisma.tenantAuthConfig.findUnique({
      where: { tenantId: tenant.id },
    });

    if (!existing) {
      await prisma.tenantAuthConfig.create({
        data: {
          tenantId: tenant.id,
          allowedMethods: ['EMAIL'],
          magicLinkEnabled: false,
          magicLinkExpiresIn: 15,
        },
      });
      configCreated++;
    }
  }
  console.log(`   ✅ Created ${configCreated} tenant auth configs`);

  console.log('🔗 Auth links migration complete.');
}
