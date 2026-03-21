/**
 * Standalone Permission Migration Script
 *
 * Safely migrates permissions from old 721 codes to new 243 codes.
 * Can be run in any environment (local, staging, production).
 *
 * What it does:
 * 1. Creates all new permission codes
 * 2. Removes all old/stale permission codes (and their group/user associations)
 * 3. Reassigns Admin group → all permissions
 * 4. Reassigns User group → DEFAULT_USER_PERMISSIONS (27 codes)
 *
 * Usage: npx tsx --env-file=.env prisma/migrate-permissions.ts
 * Production: npx tsx --env-file=.env.production prisma/migrate-permissions.ts
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';

import {
  DEFAULT_USER_PERMISSIONS,
  PermissionCodes,
} from '../src/constants/rbac/permission-codes.js';
import {
  PermissionGroupSlugs,
} from '../src/constants/rbac/permission-groups.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractAllCodes(obj: Record<string, unknown>): string[] {
  const codes: string[] = [];
  for (const value of Object.values(obj)) {
    if (typeof value === 'string') {
      codes.push(value);
    } else if (typeof value === 'object' && value !== null) {
      codes.push(...extractAllCodes(value as Record<string, unknown>));
    }
  }
  return codes;
}

const MODULE_LABELS: Record<string, string> = {
  stock: 'Estoque',
  finance: 'Financeiro',
  hr: 'Recursos Humanos',
  sales: 'Vendas',
  admin: 'Administração',
  tools: 'Ferramentas',
  system: 'Sistema',
};

const ACTION_LABELS: Record<string, string> = {
  access: 'Acessar',
  register: 'Cadastrar',
  modify: 'Alterar',
  remove: 'Remover',
  import: 'Importar',
  export: 'Exportar',
  print: 'Imprimir',
  admin: 'Administrar',
  share: 'Compartilhar',
  onlyself: 'Apenas Próprio',
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatResource(resource: string): string {
  return resource.split('-').map(capitalize).join(' ');
}

function generateName(code: string): string {
  const parts = code.split('.');
  const action = parts[parts.length - 1];
  const mod = parts[0];
  const resourceParts = parts.slice(1, -1);
  const actionLabel = ACTION_LABELS[action] ?? capitalize(action);
  const resourceLabel = resourceParts.map(formatResource).filter(Boolean).join(' ');

  if (!resourceLabel) {
    return `${actionLabel} ${capitalize(mod)}`;
  }

  return `${actionLabel} ${resourceLabel}`;
}

function buildPermissionData(code: string) {
  const parts = code.split('.');
  const action = parts[parts.length - 1];
  const module = parts[0];
  const resource = parts.slice(1, -1).join('.');
  return {
    code,
    name: generateName(code),
    description: `Permite ${generateName(code).toLowerCase()}`,
    module,
    resource,
    action,
    isSystem: true,
  };
}

// ---------------------------------------------------------------------------
// Migration Steps
// ---------------------------------------------------------------------------

async function main() {
  console.log('🔄 Migração de Permissões — OpenSea RBAC v2\n');

  const allCodes = extractAllCodes(PermissionCodes as Record<string, unknown>);
  const validCodes = new Set(allCodes);
  console.log(`📦 ${allCodes.length} novas permissões definidas\n`);

  // Step 1: Create new permissions
  console.log('📝 Passo 1: Criando novas permissões...');
  const existing = await prisma.permission.findMany({
    where: { isSystem: true },
    select: { code: true },
  });
  const existingCodes = new Set(existing.map(p => p.code));

  const toCreate = allCodes.filter(c => !existingCodes.has(c));
  const toUpdate = allCodes.filter(c => existingCodes.has(c));

  if (toCreate.length > 0) {
    await prisma.permission.createMany({
      data: toCreate.map(buildPermissionData),
      skipDuplicates: true,
    });
  }

  if (toUpdate.length > 0) {
    const BATCH_SIZE = 50;
    for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
      const batch = toUpdate.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(
        batch.map(code => {
          const data = buildPermissionData(code);
          return prisma.permission.update({
            where: { code },
            data: {
              name: data.name,
              description: data.description,
              module: data.module,
              resource: data.resource,
              action: data.action,
            },
          });
        }),
      );
    }
  }
  console.log(`   ✅ ${toCreate.length} criadas, ${toUpdate.length} atualizadas\n`);

  // Step 2: Remove stale permissions
  console.log('🧹 Passo 2: Removendo permissões obsoletas...');
  const stale = await prisma.permission.findMany({
    where: {
      isSystem: true,
      code: { notIn: [...validCodes] },
    },
    select: { id: true, code: true },
  });

  if (stale.length > 0) {
    const staleIds = stale.map(p => p.id);

    // Remove associations first
    const deletedGroupPerms = await prisma.permissionGroupPermission.deleteMany({
      where: { permissionId: { in: staleIds } },
    });
    const deletedUserPerms = await prisma.userDirectPermission.deleteMany({
      where: { permissionId: { in: staleIds } },
    });
    await prisma.permission.deleteMany({
      where: { id: { in: staleIds } },
    });

    console.log(`   ✅ ${stale.length} permissões removidas`);
    console.log(`   ✅ ${deletedGroupPerms.count} associações de grupo removidas`);
    console.log(`   ✅ ${deletedUserPerms.count} permissões diretas removidas\n`);
  } else {
    console.log('   ✅ Nenhuma permissão obsoleta\n');
  }

  // Step 3: Reassign Admin group
  console.log('👥 Passo 3: Reassociando grupos...');

  const allPermissions = await prisma.permission.findMany({
    where: { isSystem: true, code: { in: allCodes } },
    select: { id: true, code: true },
  });
  const permissionMap = new Map(allPermissions.map(p => [p.code, p.id]));

  // Find all admin/user groups across all tenants
  // Slugs may be 'admin', 'admin-{tenantId}', 'user', 'user-{tenantId}'
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

  // Reassign admin groups
  for (const group of adminGroups) {
    // Remove existing associations
    await prisma.permissionGroupPermission.deleteMany({
      where: { groupId: group.id },
    });
    // Add all new permissions
    await prisma.permissionGroupPermission.createMany({
      data: allPermissions.map(p => ({
        groupId: group.id,
        permissionId: p.id,
        effect: 'allow' as const,
      })),
      skipDuplicates: true,
    });
    console.log(`   ✅ Admin group (tenant: ${group.tenantId ?? 'global'}) → ${allPermissions.length} permissões`);
  }

  // Reassign user groups
  const userPermissionIds = DEFAULT_USER_PERMISSIONS
    .map(code => permissionMap.get(code))
    .filter((id): id is string => !!id);

  for (const group of userGroups) {
    await prisma.permissionGroupPermission.deleteMany({
      where: { groupId: group.id },
    });
    await prisma.permissionGroupPermission.createMany({
      data: userPermissionIds.map(permissionId => ({
        groupId: group.id,
        permissionId,
        effect: 'allow' as const,
      })),
      skipDuplicates: true,
    });
    console.log(`   ✅ User group (tenant: ${group.tenantId ?? 'global'}) → ${userPermissionIds.length} permissões`);
  }

  // Step 4: Summary
  console.log('\n📊 Resumo:');
  const finalCount = await prisma.permission.count({ where: { isSystem: true } });
  console.log(`   Total de permissões no sistema: ${finalCount}`);
  console.log(`   Grupos Admin atualizados: ${adminGroups.length}`);
  console.log(`   Grupos User atualizados: ${userGroups.length}`);
  console.log('\n🎉 Migração concluída com sucesso!');
}

main()
  .catch(e => {
    console.error('❌ Erro na migração:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
