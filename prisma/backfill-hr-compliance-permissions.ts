/**
 * Standalone Backfill Script — Phase 6 / Plan 06-01 RBAC Permissions
 *
 * Garante que TODOS os admin groups (admin / admin-{prefix}) tenham as 8
 * novas permissões `hr.compliance.*` (Phase 6) atribuídas no banco.
 *
 * Por que existe:
 * Os 8 codes foram adicionados em `permission-codes.ts` no Plan 06-01,
 * porém usuários admin/owner CRIADOS antes desse commit não herdam as
 * permissões retroativamente — `permission_group_permissions` precisa
 * ser sincronizado para cada admin group já existente.
 *
 * Pattern canônico (idêntico a backfill-phase4-permissions.ts):
 * - findMany única com OR + startsWith para cobrir admin/admin-{prefix}
 * - createMany skipDuplicates (idempotente, aditivo, sem remoções em massa)
 * - per-group verification — process.exit(1) se QUALQUER admin ficar
 *   sem QUALQUER dos 8 codes (deploy-blocker explícito).
 *
 * Decisão D-08 (Plan 06-01): user groups NÃO recebem hr.compliance.*
 * por default — compliance é ferramenta RH/admin. Funcionários NÃO têm
 * `access` por padrão.
 *
 * Usage:
 *   npx tsx --env-file=.env prisma/backfill-hr-compliance-permissions.ts
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
// Helpers (espelham backfill-phase4-permissions.ts para consistência)
// ---------------------------------------------------------------------------

const MODULE_LABELS: Record<string, string> = {
  hr: 'Recursos Humanos',
};

const ACTION_LABELS: Record<string, string> = {
  access: 'Acessar',
  generate: 'Gerar',
  submit: 'Submeter',
  download: 'Baixar',
  modify: 'Alterar',
  admin: 'Administrar',
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
// Phase 6 / Plan 06-01 codes (single source of truth — derivados de PermissionCodes)
// ---------------------------------------------------------------------------

const PHASE6_COMPLIANCE_CODES: readonly string[] = [
  PermissionCodes.HR.COMPLIANCE.ACCESS,
  PermissionCodes.HR.COMPLIANCE.AFD_GENERATE,
  PermissionCodes.HR.COMPLIANCE.AFDT_GENERATE,
  PermissionCodes.HR.COMPLIANCE.FOLHA_ESPELHO_GENERATE,
  PermissionCodes.HR.COMPLIANCE.S1200_SUBMIT,
  PermissionCodes.HR.COMPLIANCE.ARTIFACT_DOWNLOAD,
  PermissionCodes.HR.COMPLIANCE.CONFIG_MODIFY,
  PermissionCodes.HR.COMPLIANCE.ADMIN,
] as const;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🔄 Backfill de Permissões Phase 6 — hr.compliance.*\n');

  // Passo 1 — garantir as 8 permissions hr.compliance.* (idempotent upsert)
  console.log(
    `📝 Passo 1: Garantindo ${PHASE6_COMPLIANCE_CODES.length} permissões hr.compliance.*...`,
  );
  let inserted = 0;
  let updated = 0;
  for (const code of PHASE6_COMPLIANCE_CODES) {
    const data = buildPermissionData(code);
    const existing = await prisma.permission.findUnique({ where: { code } });
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
    if (existing) {
      updated++;
    } else {
      inserted++;
    }
  }
  console.log(
    `   ✅ ${PHASE6_COMPLIANCE_CODES.length} permissions asseguradas (${inserted} inseridas, ${updated} atualizadas)\n`,
  );

  // Carrega TODAS as permissions (inclui as 8 Phase 6 após Passo 1)
  const allPermissions = await prisma.permission.findMany({
    select: { id: true, code: true },
  });
  const phase6PermissionIds = allPermissions
    .filter((p) =>
      (PHASE6_COMPLIANCE_CODES as readonly string[]).includes(p.code),
    )
    .map((p) => p.id);

  if (phase6PermissionIds.length !== PHASE6_COMPLIANCE_CODES.length) {
    console.error(
      `   ❌ Esperado ${PHASE6_COMPLIANCE_CODES.length} permissions hr.compliance.* no banco; encontrado ${phase6PermissionIds.length}. Abortando.`,
    );
    process.exit(1);
  }

  // Passo 2 — sincronizar todos os admin groups com os 8 codes Phase 6
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

  for (const group of adminGroups) {
    await prisma.permissionGroupPermission.createMany({
      data: phase6PermissionIds.map((permissionId) => ({
        groupId: group.id,
        permissionId,
        effect: 'allow' as const,
      })),
      skipDuplicates: true,
    });
    console.log(
      `   ✅ Admin group ${group.slug} (tenant: ${group.tenantId ?? 'global'}) → ${phase6PermissionIds.length} permissões hr.compliance.*`,
    );
  }

  if (adminGroups.length === 0) {
    console.log('   ⚠ Nenhum admin group encontrado — nada a sincronizar');
  }

  // Passo 3 — Decisão D-08: user groups NÃO recebem hr.compliance.* por padrão
  console.log(
    '\n👤 Passo 3: User groups intencionalmente PULADOS (decisão D-08 — compliance é ferramenta RH/admin).',
  );

  // Passo 4 — verificação final em TODOS os admin groups
  console.log(
    '\n🔎 Verificação final — cada admin group deve ter os 8 códigos hr.compliance.*:',
  );

  const assocs = await prisma.permissionGroupPermission.findMany({
    where: {
      groupId: { in: adminGroups.map((g) => g.id) },
      permissionId: { in: phase6PermissionIds },
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
    const missing = PHASE6_COMPLIANCE_CODES.filter(
      (code) => !present.has(code),
    );
    if (missing.length > 0) {
      console.error(
        `   ❌ Admin group ${group.slug} (tenant: ${group.tenantId ?? 'global'}): faltam [${missing.join(', ')}]`,
      );
      failures++;
    } else {
      console.log(
        `   ✅ Admin group ${group.slug} (tenant: ${group.tenantId ?? 'global'}): 8/8 códigos hr.compliance.* presentes`,
      );
    }
  }

  if (failures > 0) {
    console.error(
      `\n❌ FAILED: ${failures} admin group(s) com drift de permissões hr.compliance.*. Investigar.`,
    );
    process.exit(1);
  }

  console.log(
    `\n✅ Backfill concluído com sucesso. ${adminGroups.length} admin group(s) cobertos, 0 gaps.`,
  );
}

main()
  .catch((e) => {
    console.error('❌ Erro no backfill:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
