import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';

import {
  PermissionCodes,
  DEFAULT_USER_PERMISSIONS,
} from '../src/constants/rbac/permission-codes.js';
import {
  PermissionGroupSlugs,
  PermissionGroupColors,
  PermissionGroupPriorities,
} from '../src/constants/rbac/permission-groups.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively extracts every leaf string from a nested object. */
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
  self: 'Pessoal',
  ui: 'Interface',
  reports: 'Relatórios',
  data: 'Dados',
  settings: 'Configurações',
  core: 'Core',
  rbac: 'Controle de Acesso',
  audit: 'Auditoria',
  notifications: 'Notificações',
  stock: 'Estoque',
  sales: 'Vendas',
  requests: 'Requisições',
  hr: 'Recursos Humanos',
};

const ACTION_LABELS: Record<string, string> = {
  create: 'Criar',
  read: 'Visualizar',
  update: 'Atualizar',
  delete: 'Excluir',
  list: 'Listar',
  manage: 'Gerenciar',
  approve: 'Aprovar',
  cancel: 'Cancelar',
  request: 'Solicitar',
  revoke: 'Revogar',
  'revoke-all': 'Revogar Todas',
  search: 'Buscar',
  view: 'Visualizar',
  generate: 'Gerar',
  process: 'Processar',
  terminate: 'Desligar',
  release: 'Liberar',
  entry: 'Entrada',
  exit: 'Saída',
  transfer: 'Transferir',
  configure: 'Configurar',
  duplicate: 'Duplicar',
  send: 'Enviar',
  broadcast: 'Transmitir',
  schedule: 'Agendar',
  assign: 'Atribuir',
  complete: 'Concluir',
  reject: 'Rejeitar',
  comment: 'Comentar',
  download: 'Baixar',
  set: 'Definir',
  close: 'Fechar',
  reopen: 'Reabrir',
  deliver: 'Entregar',
  return: 'Devolver',
  'add-item': 'Adicionar Item',
  'remove-item': 'Remover Item',
  romaneio: 'Romaneio',
  restore: 'Restaurar',
};

const SCOPE_LABELS: Record<string, string> = {
  all: 'Todos',
  team: 'Equipe',
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatResource(resource: string): string {
  if (resource === '_root') return '';
  return resource
    .split('-')
    .map(capitalize)
    .join(' ');
}

function generateName(code: string): string {
  const parts = code.split('.');
  const [mod, resource, action, scope] = parts;
  const actionLabel = ACTION_LABELS[action] ?? capitalize(action);
  const resourceLabel = formatResource(resource);
  const scopeSuffix = scope ? ` (${SCOPE_LABELS[scope] ?? scope})` : '';

  if (!resourceLabel) {
    const moduleLabel = MODULE_LABELS[mod] ?? capitalize(mod);
    return `${actionLabel} ${moduleLabel}${scopeSuffix}`;
  }

  return `${actionLabel} ${resourceLabel}${scopeSuffix}`;
}

function buildPermissionData(code: string) {
  const parts = code.split('.');
  return {
    code,
    name: generateName(code),
    description: `Permite ${generateName(code).toLowerCase()}`,
    module: parts[0],
    resource: parts[1],
    action: parts[2],
    isSystem: true,
  };
}

// ---------------------------------------------------------------------------
// Seed steps
// ---------------------------------------------------------------------------

async function seedPermissions(codes: string[]) {
  console.log(`📝 Sincronizando ${codes.length} permissões...`);

  const existing = await prisma.permission.findMany({
    where: { isSystem: true },
    select: { code: true },
  });
  const existingCodes = new Set(existing.map((p) => p.code));

  const toCreate = codes.filter((c) => !existingCodes.has(c));
  const toUpdate = codes.filter((c) => existingCodes.has(c));

  if (toCreate.length > 0) {
    await prisma.permission.createMany({
      data: toCreate.map(buildPermissionData),
      skipDuplicates: true,
    });
  }

  if (toUpdate.length > 0) {
    await prisma.$transaction(
      toUpdate.map((code) => {
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

  console.log(
    `   ✅ ${toCreate.length} criadas, ${toUpdate.length} atualizadas`,
  );
}

async function cleanupStalePermissions(validCodes: Set<string>) {
  const stale = await prisma.permission.findMany({
    where: {
      isSystem: true,
      code: { notIn: [...validCodes] },
    },
    select: { id: true, code: true },
  });

  if (stale.length === 0) return;

  const staleIds = stale.map((p) => p.id);
  console.log(`🧹 Removendo ${stale.length} permissões obsoletas...`);

  await prisma.permissionGroupPermission.deleteMany({
    where: { permissionId: { in: staleIds } },
  });
  await prisma.userDirectPermission.deleteMany({
    where: { permissionId: { in: staleIds } },
  });
  await prisma.permission.deleteMany({
    where: { id: { in: staleIds } },
  });

  console.log(`   ✅ Removidas: ${stale.map((p) => p.code).join(', ')}`);
}

async function seedGroups() {
  console.log('👥 Criando grupos de permissões...');

  // --- Admin Group ---
  let adminGroup = await prisma.permissionGroup.findFirst({
    where: { slug: PermissionGroupSlugs.ADMIN, deletedAt: null },
  });

  if (!adminGroup) {
    adminGroup = await prisma.permissionGroup.create({
      data: {
        name: 'Administrador',
        slug: PermissionGroupSlugs.ADMIN,
        description: 'Acesso completo ao sistema com todas as permissões.',
        isSystem: true,
        isActive: true,
        color: PermissionGroupColors[PermissionGroupSlugs.ADMIN],
        priority: PermissionGroupPriorities[PermissionGroupSlugs.ADMIN],
      },
    });
  }

  const allPerms = await prisma.permission.findMany({
    select: { id: true, code: true },
  });

  await prisma.permissionGroupPermission.createMany({
    data: allPerms.map((p) => ({
      groupId: adminGroup!.id,
      permissionId: p.id,
      effect: 'allow',
    })),
    skipDuplicates: true,
  });

  // Remove stale group-permission links for admin
  const allPermIds = new Set(allPerms.map((p) => p.id));
  await prisma.permissionGroupPermission.deleteMany({
    where: {
      groupId: adminGroup.id,
      permissionId: { notIn: [...allPermIds] },
    },
  });

  console.log(
    `   ✅ Grupo "Administrador" com ${allPerms.length} permissões`,
  );

  // --- User Group ---
  let userGroup = await prisma.permissionGroup.findFirst({
    where: { slug: PermissionGroupSlugs.USER, deletedAt: null },
  });

  if (!userGroup) {
    userGroup = await prisma.permissionGroup.create({
      data: {
        name: 'Usuário',
        slug: PermissionGroupSlugs.USER,
        description: 'Acesso básico aos próprios dados do usuário.',
        isSystem: true,
        isActive: true,
        color: PermissionGroupColors[PermissionGroupSlugs.USER],
        priority: PermissionGroupPriorities[PermissionGroupSlugs.USER],
      },
    });
  }

  const permCodeToId = new Map(allPerms.map((p) => [p.code, p.id]));
  const userPermIds = DEFAULT_USER_PERMISSIONS.map((code) =>
    permCodeToId.get(code),
  ).filter((id): id is string => id !== undefined);

  await prisma.permissionGroupPermission.createMany({
    data: userPermIds.map((permissionId) => ({
      groupId: userGroup!.id,
      permissionId,
      effect: 'allow',
    })),
    skipDuplicates: true,
  });

  // Remove stale group-permission links for user
  const validUserPermIds = new Set(userPermIds);
  await prisma.permissionGroupPermission.deleteMany({
    where: {
      groupId: userGroup.id,
      permissionId: { notIn: [...validUserPermIds] },
    },
  });

  console.log(
    `   ✅ Grupo "Usuário" com ${userPermIds.length} permissões`,
  );

  return { adminGroupId: adminGroup.id, userGroupId: userGroup.id };
}

async function seedAdminUser(adminGroupId: string) {
  console.log('🔑 Criando usuário admin...');

  const passwordHash = await hash('Teste@123', 6);

  let adminUser = await prisma.user.findFirst({
    where: { email: 'admin@teste.com', deletedAt: null },
  });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@teste.com',
        username: 'admin',
        password_hash: passwordHash,
      },
    });
  } else {
    adminUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: { password_hash: passwordHash },
    });
  }

  await prisma.userPermissionGroup.upsert({
    where: {
      userId_groupId: {
        userId: adminUser.id,
        groupId: adminGroupId,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      groupId: adminGroupId,
      grantedBy: null,
    },
  });

  console.log('   ✅ admin@teste.com (senha: Teste@123)');
}

async function assignOrphanUsers(userGroupId: string) {
  const orphans = await prisma.user.findMany({
    where: {
      deletedAt: null,
      permissionGroups: { none: {} },
    },
  });

  if (orphans.length === 0) return;

  await prisma.userPermissionGroup.createMany({
    data: orphans.map((u) => ({
      userId: u.id,
      groupId: userGroupId,
      grantedBy: null,
    })),
    skipDuplicates: true,
  });

  console.log(
    `   ✅ ${orphans.length} usuários sem grupo atribuídos ao grupo "Usuário"`,
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  const allCodes = extractAllCodes(PermissionCodes as Record<string, unknown>);
  console.log(`📦 ${allCodes.length} permissões descobertas em PermissionCodes\n`);

  await seedPermissions(allCodes);
  await cleanupStalePermissions(new Set(allCodes));

  const { adminGroupId, userGroupId } = await seedGroups();
  await seedAdminUser(adminGroupId);
  await assignOrphanUsers(userGroupId);

  console.log('\n🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
