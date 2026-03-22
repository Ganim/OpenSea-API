import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { PrismaClient } from './generated/prisma/client.js';

// Load environment variables from .env file
try {
  process.loadEnvFile();
} catch {
  // .env file not found; environment variables are expected to be set externally
}

import {
  DEFAULT_USER_PERMISSIONS,
  PermissionCodes,
} from '../src/constants/rbac/permission-codes.js';
import {
  PermissionGroupColors,
  PermissionGroupPriorities,
  PermissionGroupSlugs,
} from '../src/constants/rbac/permission-groups.js';
import {
  FILTER_FOLDER_CONFIGS,
  ROOT_SYSTEM_FOLDERS,
  slugify,
} from '../src/constants/storage/folder-templates.js';

import { seedSkillDefinitions } from './seeds/skill-definitions.js';
import { seedSkillPricing } from './seeds/skill-pricing.js';
import { seedCentralUsers } from './seeds/central-users.js';
import { seedSupportSlaConfig } from './seeds/support-sla-config.js';

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
  calendar: 'Calendário',
  email: 'E-mail',
  studio: 'Studio',
  storage: 'Arquivos',
  finance: 'Financeiro',
  tasks: 'Tarefas',
  admin: 'Administração',
  tools: 'Ferramentas',
  system: 'Sistema',
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
  upload: 'Enviar',
  move: 'Mover',
  set: 'Definir',
  close: 'Fechar',
  reopen: 'Reabrir',
  deliver: 'Entregar',
  return: 'Devolver',
  'add-item': 'Adicionar Item',
  'remove-item': 'Remover Item',
  romaneio: 'Romaneio',
  restore: 'Restaurar',
  use: 'Usar',
  invite: 'Convidar',
  respond: 'Responder',
  share: 'Compartilhar',
  execute: 'Executar',
  access: 'Acessar',
  register: 'Cadastrar',
  modify: 'Modificar',
  remove: 'Remover',
  import: 'Importar',
  export: 'Exportar',
  print: 'Imprimir',
  admin: 'Administrar',
  onlyself: 'Apenas Próprio',
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
  return resource.split('-').map(capitalize).join(' ');
}

function generateName(code: string): string {
  const parts = code.split('.');
  const action = parts[parts.length - 1]; // last part is always the action
  const mod = parts[0];
  const resourceParts = parts.slice(1, -1); // everything between module and action
  const actionLabel = ACTION_LABELS[action] ?? capitalize(action);
  const resourceLabel = resourceParts
    .map(formatResource)
    .filter(Boolean)
    .join(' ');

  if (!resourceLabel) {
    const moduleLabel = MODULE_LABELS[mod] ?? capitalize(mod);
    return `${actionLabel} ${moduleLabel}`;
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
    // Process in batches to avoid transaction timeout on remote DBs
    const BATCH_SIZE = 50;
    for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
      const batch = toUpdate.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(
        batch.map((code) => {
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

  console.log(`   ✅ Grupo "Administrador" com ${allPerms.length} permissões`);

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

  console.log(`   ✅ Grupo "Usuário" com ${userPermIds.length} permissões`);

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

async function fixLegacyTenantGroups() {
  // Fix tenant groups that were created with bare slugs ('admin'/'user') instead of tenant-specific ones
  const legacyGroups = await prisma.permissionGroup.findMany({
    where: {
      tenantId: { not: null },
      slug: { in: [PermissionGroupSlugs.ADMIN, PermissionGroupSlugs.USER] },
      deletedAt: null,
    },
  });

  if (legacyGroups.length === 0) return;

  console.log(
    `🔧 Corrigindo ${legacyGroups.length} grupos com slugs legados...`,
  );

  for (const group of legacyGroups) {
    const tenantIdPrefix = group.tenantId!.substring(0, 8);
    const newSlug = `${group.slug}-${tenantIdPrefix}`;
    const isUser = group.slug === PermissionGroupSlugs.USER;

    await prisma.permissionGroup.update({
      where: { id: group.id },
      data: {
        slug: newSlug,
        isSystem: false,
        name: isUser ? 'Usuário' : 'Administrador',
        description: isUser
          ? 'Acesso básico aos próprios dados do usuário.'
          : 'Acesso completo ao sistema com todas as permissões.',
      },
    });
  }

  console.log(`   ✅ ${legacyGroups.length} grupos corrigidos`);
}

async function assignOrphanUsers(userGroupId: string) {
  // Assign orphan users that belong to tenants to their tenant's "Usuário" group
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true },
  });

  for (const tenant of tenants) {
    const tenantUserGroup = await prisma.permissionGroup.findFirst({
      where: {
        slug: `${PermissionGroupSlugs.USER}-${tenant.id.substring(0, 8)}`,
        tenantId: tenant.id,
        deletedAt: null,
      },
    });

    if (!tenantUserGroup) continue;

    // Find tenant users without this tenant's user group
    const tenantUsers = await prisma.tenantUser.findMany({
      where: { tenantId: tenant.id, deletedAt: null },
      select: { userId: true },
    });

    for (const tu of tenantUsers) {
      await prisma.userPermissionGroup.upsert({
        where: {
          userId_groupId: {
            userId: tu.userId,
            groupId: tenantUserGroup.id,
          },
        },
        update: {},
        create: {
          userId: tu.userId,
          groupId: tenantUserGroup.id,
          grantedBy: null,
        },
      });
    }

    if (tenantUsers.length > 0) {
      console.log(
        `   ✅ ${tenantUsers.length} usuários do tenant "${tenant.name}" verificados no grupo "Usuário"`,
      );
    }
  }

  // Also assign truly orphan users (no tenant, no groups) to global user group
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
    `   ✅ ${orphans.length} usuários sem grupo atribuídos ao grupo global "Usuário"`,
  );
}

// ---------------------------------------------------------------------------
// Multi-Tenant Seed Steps
// ---------------------------------------------------------------------------

async function seedSuperAdmin() {
  console.log('🔐 Criando superadmin...');

  const passwordHash = await hash('Super@123', 6);

  let superAdmin = await prisma.user.findFirst({
    where: { email: 'super@teste.com', deletedAt: null },
  });

  if (!superAdmin) {
    superAdmin = await prisma.user.create({
      data: {
        email: 'super@teste.com',
        username: 'superadmin',
        password_hash: passwordHash,
        isSuperAdmin: true,
      },
    });
  } else {
    superAdmin = await prisma.user.update({
      where: { id: superAdmin.id },
      data: { password_hash: passwordHash, isSuperAdmin: true },
    });
  }

  console.log('   ✅ super@teste.com (senha: Super@123, isSuperAdmin: true)');
  return superAdmin.id;
}

async function seedPlans() {
  console.log('📋 Criando planos...');

  const plans = [
    {
      name: 'Free',
      tier: 'FREE' as const,
      price: 0,
      maxUsers: 3,
      maxWarehouses: 1,
      maxProducts: 50,
      description: 'Plano gratuito para pequenas operações',
    },
    {
      name: 'Starter',
      tier: 'STARTER' as const,
      price: 99.9,
      maxUsers: 10,
      maxWarehouses: 3,
      maxProducts: 500,
      description: 'Plano inicial para empresas em crescimento',
    },
    {
      name: 'Professional',
      tier: 'PROFESSIONAL' as const,
      price: 299.9,
      maxUsers: 50,
      maxWarehouses: 10,
      maxProducts: 5000,
      description: 'Plano profissional com recursos avançados',
    },
    {
      name: 'Enterprise',
      tier: 'ENTERPRISE' as const,
      price: 0,
      maxUsers: 999999,
      maxWarehouses: 999999,
      maxProducts: 999999,
      description: 'Plano empresarial com recursos ilimitados',
    },
  ];

  const createdPlans: Record<string, string> = {};

  for (const plan of plans) {
    const upserted = await prisma.plan.upsert({
      where: { name: plan.name },
      update: {
        tier: plan.tier,
        price: plan.price,
        maxUsers: plan.maxUsers,
        maxWarehouses: plan.maxWarehouses,
        maxProducts: plan.maxProducts,
        description: plan.description,
        isActive: true,
      },
      create: plan,
    });
    createdPlans[plan.name] = upserted.id;
    console.log(`   ✅ Plano "${plan.name}" (${plan.tier}) - R$ ${plan.price}`);
  }

  return createdPlans;
}

async function seedPlanModules(planIds: Record<string, string>) {
  console.log('📦 Configurando módulos dos planos...');

  const modulesByPlan: Record<string, string[]> = {
    Free: ['CORE'],
    Starter: ['CORE', 'STOCK', 'SALES'],
    Professional: [
      'CORE',
      'STOCK',
      'SALES',
      'HR',
      'FINANCE',
      'REPORTS',
      'AUDIT',
      'NOTIFICATIONS',
      'REQUESTS',
      'CALENDAR',
      'STORAGE',
      'EMAIL',
      'TASKS',
    ],
    Enterprise: [
      'CORE',
      'STOCK',
      'SALES',
      'HR',
      'PAYROLL',
      'FINANCE',
      'REPORTS',
      'AUDIT',
      'REQUESTS',
      'NOTIFICATIONS',
      'CALENDAR',
      'STORAGE',
      'EMAIL',
      'TASKS',
    ],
  };

  for (const [planName, modules] of Object.entries(modulesByPlan)) {
    const planId = planIds[planName];
    if (!planId) continue;

    // Remove existing modules for this plan
    await prisma.planModule.deleteMany({ where: { planId } });

    // Create new modules
    await prisma.planModule.createMany({
      data: modules.map((mod) => ({
        planId,
        module: mod as any,
      })),
      skipDuplicates: true,
    });

    console.log(`   ✅ ${planName}: [${modules.join(', ')}]`);
  }
}

async function seedDemoTenant(freePlanId: string) {
  console.log('🏢 Criando tenant demo...');

  // Find admin user
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@teste.com', deletedAt: null },
  });

  if (!adminUser) {
    console.log('   ⚠️ admin@teste.com não encontrado, pulando tenant demo');
    return null;
  }

  // Upsert tenant
  let tenant = await prisma.tenant.findFirst({
    where: { slug: 'empresa-demo' },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Empresa Demo',
        slug: 'empresa-demo',
        status: 'ACTIVE',
        settings: {},
        metadata: {},
      },
    });
  }

  // Upsert tenant user (admin@teste.com as owner)
  const existingTu = await prisma.tenantUser.findFirst({
    where: {
      tenantId: tenant.id,
      userId: adminUser.id,
      deletedAt: null,
    },
  });

  if (!existingTu) {
    await prisma.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: adminUser.id,
        role: 'owner',
      },
    });
  }

  // Upsert tenant plan
  const existingTp = await prisma.tenantPlan.findFirst({
    where: { tenantId: tenant.id },
  });

  if (!existingTp) {
    await prisma.tenantPlan.create({
      data: {
        tenantId: tenant.id,
        planId: freePlanId,
      },
    });
  }

  // Get all permissions for assigning to groups
  const allPerms = await prisma.permission.findMany({
    select: { id: true, code: true },
  });
  const permCodeToId = new Map(allPerms.map((p) => [p.code, p.id]));

  // Create tenant-specific "Administrador" group
  let tenantAdminGroup = await prisma.permissionGroup.findFirst({
    where: {
      slug: `${PermissionGroupSlugs.ADMIN}-${tenant.id.substring(0, 8)}`,
      tenantId: tenant.id,
      deletedAt: null,
    },
  });

  if (!tenantAdminGroup) {
    tenantAdminGroup = await prisma.permissionGroup.create({
      data: {
        name: 'Administrador',
        slug: `${PermissionGroupSlugs.ADMIN}-${tenant.id.substring(0, 8)}`,
        description: 'Acesso completo ao sistema com todas as permissões.',
        isSystem: false,
        isActive: true,
        color: PermissionGroupColors[PermissionGroupSlugs.ADMIN],
        priority: PermissionGroupPriorities[PermissionGroupSlugs.ADMIN],
        tenantId: tenant.id,
      },
    });
  }

  // Sync all permissions to tenant admin group (add new, remove stale)
  await prisma.permissionGroupPermission.createMany({
    data: allPerms.map((p) => ({
      groupId: tenantAdminGroup!.id,
      permissionId: p.id,
      effect: 'allow',
    })),
    skipDuplicates: true,
  });

  const allPermIds = new Set(allPerms.map((p) => p.id));
  await prisma.permissionGroupPermission.deleteMany({
    where: {
      groupId: tenantAdminGroup.id,
      permissionId: { notIn: [...allPermIds] },
    },
  });

  console.log(
    `   ✅ Grupo "Administrador" do tenant sincronizado com ${allPerms.length} permissões`,
  );

  // Create tenant-specific "Usuário" group
  let tenantUserGroup = await prisma.permissionGroup.findFirst({
    where: {
      slug: `${PermissionGroupSlugs.USER}-${tenant.id.substring(0, 8)}`,
      tenantId: tenant.id,
      deletedAt: null,
    },
  });

  if (!tenantUserGroup) {
    tenantUserGroup = await prisma.permissionGroup.create({
      data: {
        name: 'Usuário',
        slug: `${PermissionGroupSlugs.USER}-${tenant.id.substring(0, 8)}`,
        description: 'Acesso básico aos próprios dados do usuário.',
        isSystem: false,
        isActive: true,
        color: PermissionGroupColors[PermissionGroupSlugs.USER],
        priority: PermissionGroupPriorities[PermissionGroupSlugs.USER],
        tenantId: tenant.id,
      },
    });
  }

  // Sync default user permissions to tenant user group
  const userPermIds = DEFAULT_USER_PERMISSIONS.map((code) =>
    permCodeToId.get(code),
  ).filter((id): id is string => id !== undefined);

  await prisma.permissionGroupPermission.createMany({
    data: userPermIds.map((permissionId) => ({
      groupId: tenantUserGroup!.id,
      permissionId,
      effect: 'allow',
    })),
    skipDuplicates: true,
  });

  const validUserPermIds = new Set(userPermIds);
  await prisma.permissionGroupPermission.deleteMany({
    where: {
      groupId: tenantUserGroup.id,
      permissionId: { notIn: [...validUserPermIds] },
    },
  });

  console.log(
    `   ✅ Grupo "Usuário" do tenant sincronizado com ${userPermIds.length} permissões`,
  );

  // Assign admin user to tenant's admin group AND user group
  await prisma.userPermissionGroup.upsert({
    where: {
      userId_groupId: {
        userId: adminUser.id,
        groupId: tenantAdminGroup.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      groupId: tenantAdminGroup.id,
      grantedBy: null,
    },
  });

  await prisma.userPermissionGroup.upsert({
    where: {
      userId_groupId: {
        userId: adminUser.id,
        groupId: tenantUserGroup.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      groupId: tenantUserGroup.id,
      grantedBy: null,
    },
  });

  // Assign ALL tenant users to the tenant's "Usuário" group
  const tenantUsers = await prisma.tenantUser.findMany({
    where: { tenantId: tenant.id, deletedAt: null },
    select: { userId: true },
  });

  for (const tu of tenantUsers) {
    await prisma.userPermissionGroup.upsert({
      where: {
        userId_groupId: {
          userId: tu.userId,
          groupId: tenantUserGroup.id,
        },
      },
      update: {},
      create: {
        userId: tu.userId,
        groupId: tenantUserGroup.id,
        grantedBy: null,
      },
    });
  }

  console.log(
    `   ✅ ${tenantUsers.length} membros do tenant atribuídos ao grupo "Usuário"`,
  );
  console.log(`   ✅ Tenant "Empresa Demo" (slug: empresa-demo)`);
  console.log(
    `   ✅ admin@teste.com como owner e membro dos grupos Administrador + Usuário`,
  );
  console.log(`   ✅ Plano Free atribuído`);

  return tenant;
}

// ---------------------------------------------------------------------------
// Notification Templates
// ---------------------------------------------------------------------------

const CALENDAR_NOTIFICATION_TEMPLATES = [
  {
    code: 'calendar.event.invite',
    name: 'Convite para evento',
    titleTemplate: 'Convite para evento',
    messageTemplate: '{{inviterName}} convidou você para "{{eventTitle}}"',
    defaultChannel: 'IN_APP' as const,
  },
  {
    code: 'calendar.event.rsvp',
    name: 'Resposta ao convite',
    titleTemplate: 'Resposta ao convite',
    messageTemplate:
      '{{participantName}} {{status}} o convite para "{{eventTitle}}"',
    defaultChannel: 'IN_APP' as const,
  },
  {
    code: 'calendar.event.reminder',
    name: 'Lembrete de evento',
    titleTemplate: 'Lembrete de evento',
    messageTemplate:
      'Lembrete: "{{eventTitle}}" começa em {{minutesBefore}} minutos',
    defaultChannel: 'IN_APP' as const,
  },
  {
    code: 'calendar.event.removed',
    name: 'Removido do evento',
    titleTemplate: 'Removido do evento',
    messageTemplate: 'Você foi removido do evento "{{eventTitle}}"',
    defaultChannel: 'IN_APP' as const,
  },
  // EMAIL versions of calendar templates
  {
    code: 'calendar.event.invite.email',
    name: 'Convite para evento (e-mail)',
    titleTemplate: 'Você foi convidado para um evento',
    messageTemplate:
      '{{inviterName}} convidou você para o evento "{{eventTitle}}". Acesse a agenda para responder ao convite.',
    defaultChannel: 'EMAIL' as const,
  },
  {
    code: 'calendar.event.rsvp.email',
    name: 'Resposta ao convite (e-mail)',
    titleTemplate: 'Resposta ao convite do evento',
    messageTemplate:
      '{{participantName}} {{status}} o convite para o evento "{{eventTitle}}".',
    defaultChannel: 'EMAIL' as const,
  },
  {
    code: 'calendar.event.reminder.email',
    name: 'Lembrete de evento (e-mail)',
    titleTemplate: 'Lembrete: evento em breve',
    messageTemplate:
      'Lembrete: o evento "{{eventTitle}}" começa em {{minutesBefore}} minutos.',
    defaultChannel: 'EMAIL' as const,
  },
  {
    code: 'calendar.event.removed.email',
    name: 'Removido do evento (e-mail)',
    titleTemplate: 'Você foi removido de um evento',
    messageTemplate: 'Você foi removido do evento "{{eventTitle}}".',
    defaultChannel: 'EMAIL' as const,
  },
];

const EMAIL_NOTIFICATION_TEMPLATES = [
  {
    code: 'email.new_message',
    name: 'Novo e-mail recebido',
    titleTemplate: 'Novo e-mail de {{senderName}}',
    messageTemplate: '{{subject}}',
    defaultChannel: 'IN_APP' as const,
  },
  {
    code: 'email.new_messages_batch',
    name: 'Novos e-mails (lote)',
    titleTemplate: 'Novos e-mails sincronizados',
    messageTemplate:
      'A conta {{accountAddress}} recebeu {{count}} novas mensagens.',
    defaultChannel: 'IN_APP' as const,
  },
];

async function seedNotificationTemplates() {
  console.log('\n📧 Notification Templates...');

  const allTemplates = [
    ...CALENDAR_NOTIFICATION_TEMPLATES,
    ...EMAIL_NOTIFICATION_TEMPLATES,
  ];

  for (const tpl of allTemplates) {
    await prisma.notificationTemplate.upsert({
      where: { code: tpl.code },
      update: {
        name: tpl.name,
        titleTemplate: tpl.titleTemplate,
        messageTemplate: tpl.messageTemplate,
        defaultChannel: tpl.defaultChannel,
      },
      create: {
        code: tpl.code,
        name: tpl.name,
        titleTemplate: tpl.titleTemplate,
        messageTemplate: tpl.messageTemplate,
        defaultChannel: tpl.defaultChannel,
        defaultPriority: 'NORMAL',
        isActive: true,
      },
    });
    console.log(`   ✅ Template "${tpl.code}"`);
  }
}

// ---------------------------------------------------------------------------
// Storage Folders Seed
// ---------------------------------------------------------------------------

async function seedStorageFolders(tenantId: string) {
  console.log('\n📁 Inicializando pastas do Storage Manager...');

  let createdCount = 0;

  // Create root system folder tree
  for (const rootTemplate of ROOT_SYSTEM_FOLDERS) {
    const rootSlug = slugify(rootTemplate.name);
    const rootPath = `/${rootSlug}`;

    let rootFolder = await prisma.storageFolder.findFirst({
      where: { tenantId, path: rootPath, deletedAt: null },
    });

    if (!rootFolder) {
      rootFolder = await prisma.storageFolder.create({
        data: {
          tenantId,
          name: rootTemplate.name,
          slug: rootSlug,
          path: rootPath,
          icon: rootTemplate.icon,
          isSystem: true,
          module: rootTemplate.module ?? null,
          depth: 0,
        },
      });
      createdCount++;
    }

    // Create children of this root folder
    if (rootTemplate.children) {
      for (const childTemplate of rootTemplate.children) {
        const childSlug = slugify(childTemplate.name);
        const childPath = `${rootPath}/${childSlug}`;

        const existingChild = await prisma.storageFolder.findFirst({
          where: { tenantId, path: childPath, deletedAt: null },
        });

        if (!existingChild) {
          await prisma.storageFolder.create({
            data: {
              tenantId,
              parentId: rootFolder.id,
              name: childTemplate.name,
              slug: childSlug,
              path: childPath,
              icon: childTemplate.icon,
              isSystem: true,
              module: rootTemplate.module ?? null,
              depth: 1,
            },
          });
          createdCount++;
        }
      }
    }
  }

  // Create filter folders
  for (const filterConfig of FILTER_FOLDER_CONFIGS) {
    const existingFilter = await prisma.storageFolder.findFirst({
      where: { tenantId, path: filterConfig.path, deletedAt: null },
    });

    if (!existingFilter) {
      const filterSlug = slugify(filterConfig.name);

      await prisma.storageFolder.create({
        data: {
          tenantId,
          name: filterConfig.name,
          slug: filterSlug,
          path: filterConfig.path,
          isSystem: true,
          isFilter: true,
          filterFileType: filterConfig.filterFileType,
          module: filterConfig.module,
          depth: 1,
        },
      });
      createdCount++;
    }
  }

  if (createdCount > 0) {
    console.log(`   ✅ ${createdCount} pastas de sistema criadas`);
  } else {
    console.log('   ✅ Todas as pastas já existiam');
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  const allCodes = extractAllCodes(PermissionCodes as Record<string, unknown>);
  console.log(
    `📦 ${allCodes.length} permissões descobertas em PermissionCodes\n`,
  );

  await seedPermissions(allCodes);
  await cleanupStalePermissions(new Set(allCodes));

  const { adminGroupId, userGroupId } = await seedGroups();
  await seedAdminUser(adminGroupId);

  // Multi-tenant seeds
  await seedSuperAdmin();
  const planIds = await seedPlans();
  await seedPlanModules(planIds);
  const demoTenant = await seedDemoTenant(planIds['Free']);

  // Initialize storage folders for demo tenant
  if (demoTenant) {
    try {
      await seedStorageFolders(demoTenant.id);
    } catch (storageError) {
      console.log(
        '   ⚠️ Erro ao inicializar pastas de storage (não crítico):',
        storageError,
      );
    }
  }

  await fixLegacyTenantGroups();
  await assignOrphanUsers(userGroupId);
  await seedNotificationTemplates();

  // Sales pipelines for demo tenant
  if (demoTenant) {
    try {
      const { seedSalesPipelines } = await import('./seeds/sales-pipelines.js');
      await seedSalesPipelines(prisma, demoTenant.id);

      // CRM demo data (customers, contacts, deals, activities)
      const { seedSalesDemoData } = await import('./seeds/sales-demo-data.js');
      await seedSalesDemoData(prisma, demoTenant.id);
    } catch (pipelineError) {
      console.log(
        '   ⚠️ Erro ao criar pipelines/dados de vendas (não crítico):',
        pipelineError,
      );
    }
  }

  // Central Redesign seeds
  const { seedSkillDefinitions } = await import('./seeds/skill-definitions.js');
  const { seedSkillPricing } = await import('./seeds/skill-pricing.js');
  const { seedCentralUsers } = await import('./seeds/central-users.js');
  const { seedSupportSlaConfig } = await import(
    './seeds/support-sla-config.js'
  );
  await seedSkillDefinitions(prisma);
  await seedSkillPricing(prisma);
  await seedCentralUsers(prisma);
  await seedSupportSlaConfig(prisma);

  console.log('\n🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
