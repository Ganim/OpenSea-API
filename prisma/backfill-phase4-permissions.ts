/**
 * Standalone Backfill Script — Phase 4 RBAC Permissions
 *
 * Garante que TODOS os admin groups (e os user groups, na medida do
 * `DEFAULT_USER_PERMISSIONS`) tenham as 8 novas permissões de Phase 4
 * (`hr.punch-devices.*` + `hr.punch-approvals.*`) registradas no banco.
 *
 * Por que existe:
 * Os 8 codes foram adicionados em `permission-codes.ts` (commit d30254f3),
 * porém usuários admin/owner CRIADOS antes desse commit não herdam as novas
 * permissões retroativamente — `permission_group_permissions` precisa ser
 * sincronizado para cada admin group já existente. Este script faz isso de
 * forma 100% idempotente (seguro para rodar N vezes), seguindo o pattern
 * canônico já estabelecido em `prisma/migrate-permissions.ts:227-285` (uma
 * única `findMany` com `OR`+`startsWith` para cobrir admin/admin-{prefix} e
 * user/user-{prefix} em uma só query, sem iterar tenants).
 *
 * Diferença INTENCIONAL vs. `migrate-permissions.ts`:
 * Este script é PURAMENTE ADITIVO — não chama `deleteMany` em lugar algum.
 * A idempotência vem de `createMany({ skipDuplicates: true })` + `upsert`.
 *
 * Usage: npx tsx --env-file=.env prisma/backfill-phase4-permissions.ts
 * Production: npx tsx --env-file=.env.production prisma/backfill-phase4-permissions.ts
 *
 * Pode ser removido no início da Phase 6 ou 7, quando todos os ambientes já
 * tiverem sido rodados.
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
  /* .env opcional — o invocador pode ter passado --env-file=.env.production */
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Helpers (espelham migrate-permissions.ts para consistência semântica)
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
  onlyself: 'Apenas Próprio',
  confirm: 'Confirmar',
  approve: 'Aprovar',
  cancel: 'Cancelar',
  reassign: 'Reatribuir',
  reply: 'Responder',
  execute: 'Executar',
  activate: 'Ativar',
  send: 'Enviar',
  convert: 'Converter',
  sell: 'Vender',
  open: 'Abrir',
  close: 'Fechar',
  withdraw: 'Sacar',
  supply: 'Suprir',
  receive: 'Receber',
  verify: 'Verificar',
  override: 'Sobrescrever',
  publish: 'Publicar',
  generate: 'Gerar',
  query: 'Consultar',
  sync: 'Sincronizar',
  withdrawal: 'Sacar',
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
// Phase 4 codes (single source of truth — derivados de PermissionCodes)
// ---------------------------------------------------------------------------

const PHASE4_CODES: readonly string[] = [
  PermissionCodes.HR.PUNCH_DEVICES.ACCESS,
  PermissionCodes.HR.PUNCH_DEVICES.REGISTER,
  PermissionCodes.HR.PUNCH_DEVICES.MODIFY,
  PermissionCodes.HR.PUNCH_DEVICES.REMOVE,
  PermissionCodes.HR.PUNCH_DEVICES.ADMIN,
  PermissionCodes.HR.PUNCH_APPROVALS.ACCESS,
  PermissionCodes.HR.PUNCH_APPROVALS.MODIFY,
  PermissionCodes.HR.PUNCH_APPROVALS.ADMIN,
] as const;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🔄 Backfill de Permissões Phase 4\n');

  // Passo 1 — garantir as 8 permissions Phase 4 (idempotent upsert)
  console.log(
    `📝 Passo 1: Garantindo ${PHASE4_CODES.length} permissões Phase 4...`,
  );
  for (const code of PHASE4_CODES) {
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
  console.log(
    `   ✅ ${PHASE4_CODES.length} permissions Phase 4 asseguradas (criadas ou atualizadas)\n`,
  );

  // Carrega TODAS as permissions (inclui as 8 Phase 4 após Passo 1)
  const allPermissions = await prisma.permission.findMany({
    select: { id: true, code: true },
  });
  const permCodeToId = new Map(allPermissions.map((p) => [p.code, p.id]));

  // Passo 2 — sincronizar todos os admin groups com TODAS as permissions
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
      data: allPermissions.map((p) => ({
        groupId: group.id,
        permissionId: p.id,
        effect: 'allow' as const,
      })),
      skipDuplicates: true,
    });
    console.log(
      `   ✅ Admin group ${group.slug} (tenant: ${group.tenantId ?? 'global'}) → ${allPermissions.length} permissões`,
    );
  }

  if (adminGroups.length === 0) {
    console.log('   ⚠ Nenhum admin group encontrado — nada a sincronizar');
  }

  // Passo 3 — sincronizar todos os user groups com DEFAULT_USER_PERMISSIONS
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
      `   ✅ User group ${group.slug} (tenant: ${group.tenantId ?? 'global'}) → ${userPermissionIds.length} permissões`,
    );
  }

  if (userGroups.length === 0) {
    console.log('   ⚠ Nenhum user group encontrado — nada a sincronizar');
  }

  // Passo 4 — verificação final em TODOS os admin groups (não só "Empresa Demo")
  console.log(
    '\n🔎 Verificação final — cada admin group deve ter os 8 códigos Phase 4:',
  );

  const phase4PermissionIds = allPermissions
    .filter((p) => (PHASE4_CODES as readonly string[]).includes(p.code))
    .map((p) => p.id);

  const assocs = await prisma.permissionGroupPermission.findMany({
    where: {
      groupId: { in: adminGroups.map((g) => g.id) },
      permissionId: { in: phase4PermissionIds },
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
    const missing = PHASE4_CODES.filter((code) => !present.has(code));
    if (missing.length > 0) {
      console.error(
        `   ❌ Admin group ${group.slug} (tenant: ${group.tenantId ?? 'global'}): faltam [${missing.join(', ')}]`,
      );
      failures++;
    } else {
      console.log(
        `   ✅ Admin group ${group.slug} (tenant: ${group.tenantId ?? 'global'}): 8/8 códigos Phase 4 presentes`,
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
    '\n✅ Backfill concluído com sucesso. Todos os admin groups têm os 8 códigos Phase 4.',
  );
}

main()
  .catch((e) => {
    console.error('❌ Erro no backfill:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
