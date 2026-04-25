/**
 * Standalone Backfill Script — Phase 9 RBAC Permissions
 *
 * Garante que TODOS os admin groups (admin + admin-{prefix}) em TODOS os
 * tenants tenham a permissão `hr.punch.audit.access` (4 níveis — D-28 / ADR-031)
 * registrada no banco.
 *
 * Por que existe:
 * A permission JÁ é INSERTed pela migration `20260425230000_phase9_antifraude_enums_perm`
 * (ON CONFLICT DO NOTHING). Este script é a garantia operacional de junction:
 *   1. upsert idempotente da row em `Permission` (caso a migration não tenha rodado).
 *   2. createMany skipDuplicates em `PermissionGroupPermission` para cada admin
 *      group descoberto (union admin + admin-{slug} de todos os tenants).
 *   3. Verificação final per-group — process.exit(1) se algum admin group
 *      ficar sem o código (lesson STATE.md §04-06 "falha loud").
 *
 * D-28 (LGPD/RBAC gate): NÃO adiciona a `DEFAULT_USER_PERMISSIONS`. Audit
 * forensic de ponto é admin-only — funcionários NÃO veem `/hr/punch/audit`.
 *
 * Diferença INTENCIONAL vs. `migrate-permissions.ts`:
 * Este script é PURAMENTE ADITIVO — não chama `deleteMany`. Preserva overrides
 * manuais via UI. Idempotência via `createMany({ skipDuplicates: true })` +
 * `upsert`.
 *
 * Usage:
 *   npx tsx prisma/backfill-phase9-permissions.ts
 *
 * Pode ser removido no início da Phase 10 (ou quando todos os ambientes
 * tiverem sido rodados).
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
// Phase 9 codes — único novo: hr.punch.audit.access (D-28 / ADR-027)
// ---------------------------------------------------------------------------

const NEW_PERMISSION = PermissionCodes.HR.PUNCH.AUDIT.ACCESS;
const PHASE9_CODES: readonly string[] = [NEW_PERMISSION] as const;

// ---------------------------------------------------------------------------
// Helpers (idênticos a backfill-phase7-permissions.ts)
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
  // 4-level: sub-resource é absorvido em resource (ADR-024). Para
  // 'hr.punch.audit.access' → resource='punch.audit', action='access'.
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
  console.log('🔄 Backfill de Permissões Phase 9\n');

  // Passo 1 — garantir que a permission Phase 9 existe em `Permission`
  console.log(
    `📝 Passo 1: Garantindo ${PHASE9_CODES.length} permissão(ões) Phase 9...`,
  );
  for (const code of PHASE9_CODES) {
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
    `   ✅ ${PHASE9_CODES.length} permission(s) Phase 9 asseguradas\n`,
  );

  // Passo 2 — descobrir IDs das permissões Phase 9
  const phase9Permissions = await prisma.permission.findMany({
    where: { code: { in: [...PHASE9_CODES] } },
    select: { id: true, code: true },
  });

  if (phase9Permissions.length !== PHASE9_CODES.length) {
    const foundCodes = phase9Permissions.map((p) => p.code);
    const missing = PHASE9_CODES.filter((c) => !foundCodes.includes(c));
    console.error(
      `❌ FAILED: permissões Phase 9 ausentes após upsert: [${missing.join(', ')}]`,
    );
    process.exit(1);
  }

  // Passo 3 — sincronizar todos os admin groups
  console.log('👥 Passo 2: Sincronizando admin groups (todos os tenants)...');
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
      data: phase9Permissions.map((p) => ({
        groupId: group.id,
        permissionId: p.id,
        effect: 'allow' as const,
      })),
      skipDuplicates: true,
    });
    const inserted = result.count;
    added += inserted;
    skipped += phase9Permissions.length - inserted;
    console.log(
      `   ✅ Admin group ${group.slug} (tenant: ${group.tenantId ?? 'global'}) → inseridos ${inserted}, pulados ${phase9Permissions.length - inserted}`,
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
    '🔎 Verificação final — cada admin group deve ter o código Phase 9:',
  );

  const phase9PermissionIds = phase9Permissions.map((p) => p.id);
  const assocs = await prisma.permissionGroupPermission.findMany({
    where: {
      groupId: { in: adminGroups.map((g) => g.id) },
      permissionId: { in: phase9PermissionIds },
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
    const missing = PHASE9_CODES.filter((code) => !present.has(code));
    if (missing.length > 0) {
      console.error(
        `   ❌ Admin group ${group.slug} (tenant: ${group.tenantId ?? 'global'}): faltam [${missing.join(', ')}]`,
      );
      failures++;
    } else {
      console.log(
        `   ✅ Admin group ${group.slug} (tenant: ${group.tenantId ?? 'global'}): ${PHASE9_CODES.length}/${PHASE9_CODES.length} códigos Phase 9 presentes`,
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
    '\n✅ OK — all admin groups verified. Backfill Phase 9 concluído.',
  );
}

main()
  .catch((e) => {
    console.error('❌ Erro no backfill:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
