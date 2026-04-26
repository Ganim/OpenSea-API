/**
 * Standalone Backfill Script — Phase 10 RBAC Permissions
 *
 * Garante que TODOS os admin groups (admin + admin-{prefix}) em TODOS os
 * tenants tenham as 3 permissões biométricas:
 *   - hr.bio.access  (visualizar agentes)
 *   - hr.bio.enroll  (gate de enrollment via verifyActionPin — Plan 10-04)
 *   - hr.bio.admin   (revogar agente, gerenciar configuração avançada)
 *
 * Por que existe:
 * As permissions JÁ são INSERTed via seed (extractAllCodes pattern — Plan 04-02).
 * Este script é a garantia operacional de junction:
 *   1. Upsert idempotente da row em `Permission` (caso o seed não tenha rodado).
 *   2. createMany skipDuplicates em `PermissionGroupPermission` para cada admin
 *      group descoberto (union admin + admin-{slug} de todos os tenants).
 *   3. Verificação final per-group — process.exit(1) se algum admin group
 *      ficar sem os 3 códigos (lesson STATE.md §04-06 "falha loud").
 *
 * D-J1 (LGPD/RBAC gate): NÃO adiciona a `DEFAULT_USER_PERMISSIONS`.
 * Biometria é ferramenta admin/RH — funcionários NÃO recebem by default.
 *
 * Diferença INTENCIONAL vs. `migrate-permissions.ts`:
 * Este script é PURAMENTE ADITIVO — não chama `deleteMany`. Preserva overrides
 * manuais via UI. Idempotência via `createMany({ skipDuplicates: true })` +
 * `upsert`.
 *
 * Usage:
 *   npx tsx prisma/backfill-phase10-permissions.ts
 *
 * Idempotente: re-execução não duplica nem falha.
 */

import { PrismaPg } from '@prisma/adapter-pg';

import { PermissionCodes } from '../src/constants/rbac/permission-codes.js';
import { PermissionGroupSlugs } from '../src/constants/rbac/permission-groups.js';

import { PrismaClient } from './generated/prisma/client.js';

try {
  process.loadEnvFile();
} catch {
  /* .env opcional — invocador pode ter passado --env-file=.env.production */
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Phase 10 codes — 3 novos: hr.bio.access, hr.bio.enroll, hr.bio.admin
// ---------------------------------------------------------------------------

const PHASE10_CODES: readonly string[] = [
  PermissionCodes.HR.PUNCH_BIO.ACCESS,
  PermissionCodes.HR.PUNCH_BIO.ENROLL,
  PermissionCodes.HR.PUNCH_BIO.ADMIN,
] as const;

// ---------------------------------------------------------------------------
// Helpers (padrão dos backfills Phase 7 + 9)
// ---------------------------------------------------------------------------

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
  enroll: 'Cadastrar biometria',
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
  const resourceLabel = resourceParts
    .map(formatResource)
    .filter(Boolean)
    .join(' ');

  if (!resourceLabel) {
    return `${actionLabel} ${MODULE_LABELS[mod] ?? capitalize(mod)}`;
  }

  return `${actionLabel} ${resourceLabel}`;
}

function buildPermissionData(code: string) {
  const parts = code.split('.');
  const action = parts[parts.length - 1];
  const mod = parts[0];
  // 3-level: resource = parts[1] (e.g. 'bio')
  const resource = parts.slice(1, -1).join('.');
  return {
    code,
    name: generateName(code),
    description: `Permite ${generateName(code).toLowerCase()}`,
    module: mod,
    resource,
    action,
    isSystem: true,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🔄 Backfill de Permissões Phase 10 (hr.bio.*)\n');

  // Passo 1 — garantir que as 3 permissions Phase 10 existem em `Permission`
  console.log(
    `📝 Passo 1: Garantindo ${PHASE10_CODES.length} permissão(ões) Phase 10...`,
  );
  for (const code of PHASE10_CODES) {
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
    console.log(`   ✅ ${code} (${data.name})`);
  }
  console.log(
    `   ✅ ${PHASE10_CODES.length} permission(s) Phase 10 asseguradas\n`,
  );

  // Passo 2 — descobrir IDs das permissões Phase 10
  const phase10Permissions = await prisma.permission.findMany({
    where: { code: { in: [...PHASE10_CODES] } },
    select: { id: true, code: true },
  });

  if (phase10Permissions.length !== PHASE10_CODES.length) {
    const foundCodes = phase10Permissions.map((p) => p.code);
    const missing = PHASE10_CODES.filter((c) => !foundCodes.includes(c));
    console.error(
      `❌ FAILED: permissões Phase 10 ausentes após upsert: [${missing.join(', ')}]`,
    );
    process.exit(1);
  }

  // Passo 3 — sincronizar todos os admin groups
  console.log('👥 Passo 3: Sincronizando admin groups (todos os tenants)...');
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

  console.log(`   Encontrados ${adminGroups.length} admin group(s)`);

  let added = 0;
  let skipped = 0;
  for (const group of adminGroups) {
    const result = await prisma.permissionGroupPermission.createMany({
      data: phase10Permissions.map((p) => ({
        groupId: group.id,
        permissionId: p.id,
        effect: 'allow' as const,
      })),
      skipDuplicates: true,
    });
    const inserted = result.count;
    added += inserted;
    skipped += phase10Permissions.length - inserted;
    console.log(
      `   [phase-10-backfill] tenant ${group.tenantId ?? 'global'} admin-group ${group.slug}: inseridos ${inserted}, pulados ${phase10Permissions.length - inserted}`,
    );
  }

  if (adminGroups.length === 0) {
    console.log('   ⚠ Nenhum admin group encontrado — nada a sincronizar');
  }

  console.log(
    `\n   📊 Totais: ${added} row(s) inserida(s), ${skipped} já presente(s)\n`,
  );

  // Passo 4 — verificação final loud (STATE.md §04-06)
  console.log(
    `🔎 Verificação final — cada admin group deve ter os ${PHASE10_CODES.length} códigos Phase 10:`,
  );

  const phase10PermissionIds = phase10Permissions.map((p) => p.id);
  const assocs = await prisma.permissionGroupPermission.findMany({
    where: {
      groupId: { in: adminGroups.map((g) => g.id) },
      permissionId: { in: phase10PermissionIds },
    },
    select: { groupId: true, permission: { select: { code: true } } },
  });

  const byGroup = new Map<string, Set<string>>();
  for (const a of assocs) {
    if (!byGroup.has(a.groupId)) byGroup.set(a.groupId, new Set());
    byGroup.get(a.groupId)!.add(a.permission.code);
  }

  let failures = 0;
  for (const group of adminGroups) {
    const present = byGroup.get(group.id) ?? new Set<string>();
    const missing = PHASE10_CODES.filter((code) => !present.has(code));
    if (missing.length > 0) {
      console.error(
        `   ❌ Admin group ${group.slug} (tenant: ${group.tenantId ?? 'global'}): faltam [${missing.join(', ')}]`,
      );
      failures++;
    } else {
      console.log(
        `   ✅ Admin group ${group.slug} (tenant: ${group.tenantId ?? 'global'}): ${PHASE10_CODES.length}/${PHASE10_CODES.length} ok`,
      );
    }
  }

  if (failures > 0) {
    console.error(
      `\n❌ FAILED: ${failures} admin group(s) com drift de permissões. Investigar.`,
    );
    process.exit(1);
  }

  console.log(
    '\n✅ OK — all admin groups verified. Backfill Phase 10 concluído.',
  );
}

main()
  .catch((e) => {
    console.error('❌ Erro no backfill:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
