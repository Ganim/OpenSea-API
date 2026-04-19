/**
 * Standalone Backfill — RBAC granular para tools.notifications (Sprint 3 S3.4)
 *
 * Adiciona as 4 novas permissões `tools.notifications.*` em todos os admin
 * groups + user groups existentes. Idempotente.
 *
 * Usage: npx tsx --env-file=.env prisma/backfill-notifications-rbac.ts
 */

import { PrismaPg } from '@prisma/adapter-pg';

import {
  DEFAULT_USER_PERMISSIONS,
  PermissionCodes,
} from '../src/constants/rbac/permission-codes.js';
import { PermissionGroupSlugs } from '../src/constants/rbac/permission-groups.js';

import { PrismaClient } from './generated/prisma/client.js';

try {
  process.loadEnvFile();
} catch {
  /* .env opcional */
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const NOTIFICATIONS_CODES: readonly string[] = [
  PermissionCodes.TOOLS.NOTIFICATIONS.ACCESS,
  PermissionCodes.TOOLS.NOTIFICATIONS.PREFERENCES.ACCESS,
  PermissionCodes.TOOLS.NOTIFICATIONS.PREFERENCES.MODIFY,
  PermissionCodes.TOOLS.NOTIFICATIONS.DEVICES.ADMIN,
] as const;

const NAMES: Record<string, string> = {
  [PermissionCodes.TOOLS.NOTIFICATIONS.ACCESS]: 'Acessar Notificações',
  [PermissionCodes.TOOLS.NOTIFICATIONS.PREFERENCES.ACCESS]:
    'Visualizar Preferências de Notificação',
  [PermissionCodes.TOOLS.NOTIFICATIONS.PREFERENCES.MODIFY]:
    'Modificar Preferências de Notificação',
  [PermissionCodes.TOOLS.NOTIFICATIONS.DEVICES.ADMIN]:
    'Gerenciar Dispositivos de Notificação',
};

function buildPermissionData(code: string) {
  const parts = code.split('.');
  const action = parts[parts.length - 1];
  const mod = parts[0];
  const resource = parts.slice(1, -1).join('.');
  const name = NAMES[code] ?? code;
  return {
    code,
    name,
    description: `Permite ${name.toLowerCase()}`,
    module: mod,
    resource,
    action,
    isSystem: true,
  };
}

async function main() {
  console.log('🔄 Backfill RBAC — tools.notifications (Sprint 3 S3.4)\n');

  console.log(
    `📝 Passo 1: Garantindo ${NOTIFICATIONS_CODES.length} permissões...`,
  );
  for (const code of NOTIFICATIONS_CODES) {
    const data = buildPermissionData(code);
    await prisma.permission.upsert({
      where: { code },
      create: data,
      update: {
        name: data.name,
        description: data.description,
        module: data.module,
        resource: data.resource,
        action: data.action,
        isSystem: true,
      },
    });
  }
  console.log(`   ✅ ${NOTIFICATIONS_CODES.length} permissions asseguradas\n`);

  const allPermissions = await prisma.permission.findMany({
    select: { id: true, code: true },
  });
  const permCodeToId = new Map(allPermissions.map((p) => [p.code, p.id]));

  console.log('👥 Passo 2: Sincronizando admin groups...');
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

  const newPermIds = NOTIFICATIONS_CODES.map((code) =>
    permCodeToId.get(code),
  ).filter((id): id is string => !!id);

  for (const group of adminGroups) {
    await prisma.permissionGroupPermission.createMany({
      data: newPermIds.map((permissionId) => ({
        groupId: group.id,
        permissionId,
        effect: 'allow' as const,
      })),
      skipDuplicates: true,
    });
    console.log(
      `   ✅ Admin group ${group.slug} (tenant: ${group.tenantId ?? 'global'}) → +${newPermIds.length} perms`,
    );
  }

  console.log('\n👤 Passo 3: Sincronizando user groups...');
  const userPermissionIds = DEFAULT_USER_PERMISSIONS.map((code) =>
    permCodeToId.get(code),
  ).filter((id): id is string => !!id);

  const userGroups = await prisma.permissionGroup.findMany({
    where: {
      OR: [
        { slug: PermissionGroupSlugs.USER },
        { slug: { startsWith: `${PermissionGroupSlugs.USER}-` } },
      ],
      deletedAt: null,
    },
    select: { id: true, slug: true, tenantId: true },
  });

  for (const group of userGroups) {
    await prisma.permissionGroupPermission.createMany({
      data: userPermissionIds.map((permissionId) => ({
        groupId: group.id,
        permissionId,
        effect: 'allow' as const,
      })),
      skipDuplicates: true,
    });
    console.log(
      `   ✅ User group ${group.slug} (tenant: ${group.tenantId ?? 'global'}) → ${userPermissionIds.length} perms`,
    );
  }

  console.log('\n✅ Backfill concluído.');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Falhou:', err);
  process.exit(1);
});
