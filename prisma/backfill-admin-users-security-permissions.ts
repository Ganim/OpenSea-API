/**
 * Standalone Backfill Script — admin.users.security.*
 *
 * Garante que todos os admin groups tenham as 2 novas permissões
 * granulares de segurança de usuários (formato 4-níveis):
 *   - admin.users.security.setPassword
 *   - admin.users.security.revealAdminToken
 *
 * Por que existe:
 * Os 2 códigos foram adicionados em `permission-codes.ts` como parte
 * do fluxo de "Definir Senha pelo admin" + "Token TOTP administrativo".
 * Admin groups já existentes não herdam automaticamente — precisam ser
 * sincronizados via `permission_group_permissions`.
 *
 * Este script é PURAMENTE ADITIVO (não deleta nada) e 100% idempotente:
 * pode ser rodado N vezes sem efeito colateral.
 *
 * Usage (dev):
 *   npx tsx --env-file=.env prisma/backfill-admin-users-security-permissions.ts
 *
 * Usage (prod):
 *   npx tsx --env-file=.env.production prisma/backfill-admin-users-security-permissions.ts
 *
 * Segue o mesmo pattern de `backfill-phase4-permissions.ts`.
 */

import { PrismaPg } from '@prisma/adapter-pg';

import { PermissionCodes } from '../src/constants/rbac/permission-codes.js';
import { PermissionGroupSlugs } from '../src/constants/rbac/permission-groups.js';

import { PrismaClient } from './generated/prisma/client.js';

try {
  process.loadEnvFile();
} catch {
  /* .env opcional */
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const NEW_CODES: ReadonlyArray<{
  code: string;
  name: string;
  description: string;
}> = [
  {
    code: PermissionCodes.ADMIN.USERS.SECURITY.SET_PASSWORD,
    name: 'Definir Senha de Usuário',
    description:
      'Permite ao admin definir uma nova senha diretamente para outro usuário',
  },
  {
    code: PermissionCodes.ADMIN.USERS.SECURITY.REVEAL_ADMIN_TOKEN,
    name: 'Revelar Token Administrativo',
    description:
      'Permite ao admin revelar o token TOTP rotativo de reset de senha de outro usuário',
  },
] as const;

async function main() {
  console.log(
    '🔄 Backfill de Permissões admin.users.security.* (setPassword + revealAdminToken)\n',
  );

  // Passo 1: upsert das 2 permissions
  console.log('📝 Passo 1: Garantindo as 2 permissões...');
  for (const { code, name, description } of NEW_CODES) {
    const parts = code.split('.');
    const mod = parts[0];
    const action = parts[parts.length - 1];
    const resource = parts.slice(1, -1).join('.');
    await prisma.permission.upsert({
      where: { code },
      create: {
        code,
        name,
        description,
        module: mod,
        resource,
        action,
        isSystem: true,
      },
      update: {
        name,
        description,
        module: mod,
        resource,
        action,
        isSystem: true,
      },
    });
    console.log(`   ✅ ${code}`);
  }
  console.log();

  // Passo 2: atribuir a todos os admin groups
  console.log('👥 Passo 2: Atribuindo a todos os admin groups...');
  const adminGroups = await prisma.permissionGroup.findMany({
    where: {
      OR: [
        { slug: PermissionGroupSlugs.ADMIN },
        { slug: { startsWith: `${PermissionGroupSlugs.ADMIN}-` } },
      ],
      deletedAt: null,
    },
    select: { id: true, slug: true, tenantId: true },
  });

  const newCodes = NEW_CODES.map((p) => p.code);
  const newPerms = await prisma.permission.findMany({
    where: { code: { in: newCodes } },
    select: { id: true, code: true },
  });

  for (const group of adminGroups) {
    const result = await prisma.permissionGroupPermission.createMany({
      data: newPerms.map((p) => ({
        groupId: group.id,
        permissionId: p.id,
        effect: 'allow' as const,
      })),
      skipDuplicates: true,
    });
    console.log(
      `   ✅ Admin group ${group.slug} (tenant: ${group.tenantId ?? 'global'}) → ${result.count} atribuídas (${newPerms.length - result.count} já existiam)`,
    );
  }

  if (adminGroups.length === 0) {
    console.log('   ⚠ Nenhum admin group encontrado — nada a sincronizar');
  }

  console.log('\n✅ Backfill concluído');
}

main()
  .catch((error) => {
    console.error('❌ Erro no backfill:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
