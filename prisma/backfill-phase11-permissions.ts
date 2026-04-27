/**
 * Standalone Backfill Script — Phase 11 RBAC Permissions (Webhooks Outbound)
 *
 * Garante que TODOS os admin groups (admin + admin-{prefix}) em TODOS os
 * tenants tenham as 5 permissões `system.webhooks.endpoints.*` (4 níveis —
 * D-10 / ADR-031, quarto cluster fora de tools) registradas no banco.
 *
 * Por que existe:
 * Plan 11-01 NÃO usa migration tradicional (db push aditivo apenas), portanto
 * não há `INSERT INTO permissions` automático. Este script:
 *   1. upsert idempotente das 5 rows em `Permission`.
 *   2. createMany skipDuplicates em `PermissionGroupPermission` para cada
 *      admin group descoberto (admin + admin-{slug} de todos os tenants).
 *   3. Verificação final per-group — process.exit(1) se algum admin group
 *      ficar sem qualquer um dos 5 códigos (lesson STATE.md §04-06 "falha loud").
 *
 * D-10 (admin-only gate): NÃO adiciona a `DEFAULT_USER_PERMISSIONS`. Webhooks
 * outbound são integração de plataforma — funcionários comuns NÃO veem
 * `/devices/webhooks`. Apenas admins (que recebem todos os PermissionCodes
 * via grant inicial de admin group + este backfill).
 *
 * Diferença INTENCIONAL vs. `migrate-permissions.ts`:
 * Este script é PURAMENTE ADITIVO — não chama `deleteMany`. Preserva overrides
 * manuais via UI. Idempotência via `createMany({ skipDuplicates: true })` +
 * `upsert`.
 *
 * Usage:
 *   npm run backfill:phase11
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
// Phase 11 codes — 5 novos: system.webhooks.endpoints.* (D-10 / ADR-031)
// ---------------------------------------------------------------------------

const PHASE11_CODES = [
  PermissionCodes.SYSTEM.WEBHOOKS.ENDPOINTS.ACCESS,
  PermissionCodes.SYSTEM.WEBHOOKS.ENDPOINTS.REGISTER,
  PermissionCodes.SYSTEM.WEBHOOKS.ENDPOINTS.MODIFY,
  PermissionCodes.SYSTEM.WEBHOOKS.ENDPOINTS.REMOVE,
  PermissionCodes.SYSTEM.WEBHOOKS.ENDPOINTS.ADMIN,
] as const;

// ---------------------------------------------------------------------------
// Helpers — copiados de backfill-phase9-permissions.ts (analog 100%)
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

// PT formal — descrições específicas para webhooks outbound (mais expressivas
// que o gerador genérico de generateName para refletir a semântica de cada
// ação na UI de gestão de webhooks).
const PHASE11_DESCRIPTIONS: Record<
  string,
  { name: string; description: string }
> = {
  'system.webhooks.endpoints.access': {
    name: 'Acessar webhooks',
    description: 'Visualizar lista de webhooks outbound do tenant',
  },
  'system.webhooks.endpoints.register': {
    name: 'Cadastrar webhooks',
    description: 'Criar novo endpoint de webhook outbound',
  },
  'system.webhooks.endpoints.modify': {
    name: 'Modificar webhooks',
    description: 'Alterar URL/eventos/status de webhook existente',
  },
  'system.webhooks.endpoints.remove': {
    name: 'Excluir webhooks',
    description: 'Remover endpoint de webhook (PIN gate)',
  },
  'system.webhooks.endpoints.admin': {
    name: 'Administrar webhooks',
    description:
      'Reativar webhooks auto-desativados, regenerar secret (PIN gate)',
  },
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatResource(resource: string): string {
  return resource.split('-').map(capitalize).join(' ');
}

function generateName(code: string): string {
  // Prefer Phase 11 specific descriptions if available
  if (PHASE11_DESCRIPTIONS[code]) {
    return PHASE11_DESCRIPTIONS[code].name;
  }
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
  // 4-level: sub-resource é absorvido em resource (ADR-024).
  // 'system.webhooks.endpoints.access' → resource='webhooks.endpoints', action='access'.
  const resource = parts.slice(1, -1).join('.');
  const description =
    PHASE11_DESCRIPTIONS[code]?.description ??
    `Permite ${generateName(code).toLowerCase()}`;
  return {
    code,
    name: generateName(code),
    description,
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
  console.log('🔄 Backfill de Permissões Phase 11 (Webhooks Outbound)\n');

  // Passo 1 — garantir que as 5 permissions Phase 11 existem em `Permission`
  console.log(
    `📝 Passo 1: Garantindo ${PHASE11_CODES.length} permissão(ões) Phase 11...`,
  );
  for (const code of PHASE11_CODES) {
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
    `   ✅ ${PHASE11_CODES.length} permission(s) Phase 11 asseguradas\n`,
  );

  // Passo 2 — descobrir IDs das permissões Phase 11
  const phase11Permissions = await prisma.permission.findMany({
    where: { code: { in: [...PHASE11_CODES] } },
    select: { id: true, code: true },
  });

  if (phase11Permissions.length !== PHASE11_CODES.length) {
    const foundCodes = phase11Permissions.map((p) => p.code);
    const missing = PHASE11_CODES.filter((c) => !foundCodes.includes(c));
    console.error(
      `❌ FAILED: permissões Phase 11 ausentes após upsert: [${missing.join(', ')}]`,
    );
    process.exit(1);
  }

  // Passo 3 — sincronizar todos os admin groups (D-10 admin-only — NÃO
  // sincroniza grupos de usuário comuns).
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
      data: phase11Permissions.map((p) => ({
        groupId: group.id,
        permissionId: p.id,
        effect: 'allow' as const,
      })),
      skipDuplicates: true,
    });
    const inserted = result.count;
    added += inserted;
    skipped += phase11Permissions.length - inserted;
    console.log(
      `   ✅ Admin group ${group.slug} (tenant: ${group.tenantId ?? 'global'}) → inseridos ${inserted}, pulados ${phase11Permissions.length - inserted}`,
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
    '🔎 Verificação final — cada admin group deve ter os 5 códigos Phase 11:',
  );

  const phase11PermissionIds = phase11Permissions.map((p) => p.id);
  const assocs = await prisma.permissionGroupPermission.findMany({
    where: {
      groupId: { in: adminGroups.map((g) => g.id) },
      permissionId: { in: phase11PermissionIds },
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
    const missing = PHASE11_CODES.filter((code) => !present.has(code));
    if (missing.length > 0) {
      console.error(
        `   ❌ Admin group ${group.slug} (tenant: ${group.tenantId ?? 'global'}): faltam [${missing.join(', ')}]`,
      );
      failures++;
    } else {
      console.log(
        `   ✅ Admin group ${group.slug} (tenant: ${group.tenantId ?? 'global'}): ${PHASE11_CODES.length}/${PHASE11_CODES.length} códigos Phase 11 presentes`,
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
    '\n✅ OK — all admin groups verified. Backfill Phase 11 concluído.',
  );
}

main()
  .catch((e) => {
    console.error('❌ Erro no backfill:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
