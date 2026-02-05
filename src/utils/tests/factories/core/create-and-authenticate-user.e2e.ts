import { prisma } from '@/lib/prisma';
import { makeCreateUserUseCase } from '@/use-cases/core/users/factories/make-create-user-use-case';
import type { FastifyInstance } from 'fastify';

import request from 'supertest';

/**
 * All permissions organized by module for E2E tests
 */
const ALL_PERMISSIONS = {
  // CORE module
  core: {
    users: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    sessions: ['read', 'delete', 'list', 'revoke', 'revoke-all'],
    profiles: ['read', 'update'],
    'label-templates': [
      'create',
      'read',
      'update',
      'delete',
      'list',
      'duplicate',
      'manage',
    ],
  },
  // STOCK module
  stock: {
    products: [
      'create',
      'read',
      'update',
      'delete',
      'list',
      'request',
      'approve',
      'manage',
    ],
    variants: [
      'create',
      'read',
      'update',
      'delete',
      'list',
      'request',
      'approve',
      'manage',
    ],
    items: [
      'create',
      'read',
      'update',
      'delete',
      'list',
      'request',
      'approve',
      'entry',
      'exit',
      'transfer',
      'manage',
    ],
    movements: ['create', 'read', 'list', 'approve'],
    suppliers: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    manufacturers: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    locations: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    categories: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    tags: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    templates: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    'purchase-orders': [
      'create',
      'read',
      'update',
      'delete',
      'list',
      'approve',
      'cancel',
      'manage',
    ],
    care: ['list', 'read', 'set'],
    bins: ['list', 'read', 'update', 'manage', 'search'],
    warehouses: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    zones: [
      'create',
      'read',
      'update',
      'delete',
      'list',
      'manage',
      'configure',
    ],
    volumes: [
      'create',
      'read',
      'update',
      'delete',
      'list',
      'manage',
      'close',
      'reopen',
      'deliver',
      'return',
      'add-item',
      'remove-item',
      'romaneio',
    ],
  },
  // SALES module
  sales: {
    customers: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    orders: [
      'create',
      'read',
      'update',
      'delete',
      'list',
      'request',
      'approve',
      'manage',
    ],
    promotions: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    reservations: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    comments: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    notifications: ['create', 'read', 'update', 'delete', 'list'],
  },
  // RBAC module
  rbac: {
    permissions: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    groups: ['create', 'read', 'update', 'delete', 'list', 'assign', 'manage'],
    audit: ['read', 'list'],
    assignments: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    associations: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    'user-groups': ['create', 'read', 'update', 'delete', 'list', 'manage'],
    'user-permissions': [
      'create',
      'read',
      'update',
      'delete',
      'list',
      'manage',
    ],
  },
  // REQUESTS module
  requests: {
    requests: [
      'create',
      'read',
      'update',
      'delete',
      'list',
      'assign',
      'approve',
      'reject',
      'cancel',
      'complete',
    ],
    comments: ['create', 'read', 'update', 'delete', 'list'],
    attachments: ['create', 'read', 'delete', 'list'],
  },
  // HR module
  hr: {
    companies: [
      'create',
      'read',
      'update',
      'delete',
      'list',
      'get_by_cnpj',
      'restore',
      'manage',
    ],
    employees: [
      'create',
      'read',
      'read.all',
      'read.team',
      'update',
      'update.all',
      'update.team',
      'delete',
      'list',
      'list.all',
      'list.team',
      'terminate',
      'manage',
    ],
    departments: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    positions: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    absences: [
      'create',
      'read',
      'update',
      'delete',
      'list',
      'approve',
      'reject',
      'manage',
    ],
    vacations: [
      'create',
      'read',
      'update',
      'delete',
      'list',
      'approve',
      'reject',
      'manage',
    ],
    'time-entries': ['create', 'read', 'list', 'update', 'delete', 'manage'],
    overtime: [
      'create',
      'read',
      'read.all',
      'read.team',
      'update',
      'delete',
      'list',
      'list.all',
      'list.team',
      'approve',
      'approve.all',
      'approve.team',
      'reject',
      'manage',
    ],
    payroll: [
      'create',
      'read',
      'update',
      'delete',
      'list',
      'process',
      'approve',
      'pay',
    ],
    bonuses: ['create', 'read', 'update', 'delete', 'list'],
    deductions: ['create', 'read', 'update', 'delete', 'list'],
    'fiscal-settings': [
      'create',
      'read',
      'read_sensitive',
      'update',
      'delete',
      'list',
    ],
    stakeholders: [
      'create',
      'read',
      'read_sensitive',
      'update',
      'delete',
      'list',
      'sync_from_cnpj_api',
    ],
    'work-schedules': ['create', 'read', 'update', 'delete', 'list', 'manage'],
    'time-bank': ['create', 'read', 'update', 'list', 'manage'],
    'vacation-periods': [
      'create',
      'read',
      'update',
      'delete',
      'list',
      'schedule',
      'cancel',
      'complete',
      'sell',
      'manage',
    ],
    addresses: ['create', 'read', 'update', 'delete', 'list'],
    cnaes: ['create', 'read', 'update', 'delete', 'list'],
    'company-addresses': [
      'create',
      'read',
      'update',
      'delete',
      'list',
      'manage',
    ],
    'company-cnaes': ['create', 'read', 'update', 'delete', 'list', 'manage'],
    'company-fiscal-settings': [
      'create',
      'read',
      'update',
      'delete',
      'list',
      'manage',
    ],
    'company-stakeholder': [
      'create',
      'read',
      'update',
      'delete',
      'list',
      'manage',
    ],
    manufacturers: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    suppliers: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    payrolls: [
      'create',
      'read',
      'update',
      'delete',
      'list',
      'process',
      'approve',
      'pay',
      'manage',
    ],
    'time-control': ['create', 'read', 'update', 'delete', 'list', 'manage'],
  },
  // AUDIT module
  audit: {
    logs: ['view', 'list'],
    history: ['view'],
    rollback: ['preview', 'execute'],
    compare: ['view'],
  },
  // NOTIFICATIONS module
  notifications: {
    _root: ['broadcast', 'manage', 'schedule', 'send'],
    notifications: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    preferences: ['create', 'read', 'update', 'delete', 'list'],
  },
};

/**
 * Generate permission code from module, resource and action
 */
function generatePermissionCode(
  module: string,
  resource: string,
  action: string,
): string {
  return `${module}.${resource}.${action}`;
}

/**
 * Generate human-readable name for permission
 */
function generatePermissionName(
  module: string,
  resource: string,
  action: string,
): string {
  const actionNames: Record<string, string> = {
    create: 'Criar',
    read: 'Visualizar',
    read_sensitive: 'Visualizar Dados Sensíveis',
    update: 'Atualizar',
    delete: 'Excluir',
    list: 'Listar',
    manage: 'Gerenciar',
    approve: 'Aprovar',
    reject: 'Rejeitar',
    request: 'Solicitar',
    assign: 'Atribuir',
    cancel: 'Cancelar',
    complete: 'Completar',
    process: 'Processar',
    pay: 'Pagar',
    restore: 'Restaurar',
    get_by_cnpj: 'Buscar por CNPJ',
    sync_from_cnpj_api: 'Sincronizar da API CNPJ',
    view: 'Visualizar',
    execute: 'Executar',
    preview: 'Pré-visualizar',
    schedule: 'Agendar',
    sell: 'Vender',
    close: 'Fechar',
    reopen: 'Reabrir',
    deliver: 'Entregar',
    return: 'Retornar',
    'add-item': 'Adicionar Item',
    'remove-item': 'Remover Item',
    romaneio: 'Romaneio',
    duplicate: 'Duplicar',
  };

  const resourceNames: Record<string, string> = {
    users: 'Usuários',
    sessions: 'Sessões',
    profiles: 'Perfis',
    'label-templates': 'Templates de Etiquetas',
    products: 'Produtos',
    variants: 'Variantes',
    items: 'Itens',
    movements: 'Movimentações',
    suppliers: 'Fornecedores',
    manufacturers: 'Fabricantes',
    locations: 'Localizações',
    categories: 'Categorias',
    tags: 'Tags',
    templates: 'Templates',
    'purchase-orders': 'Pedidos de Compra',
    customers: 'Clientes',
    orders: 'Pedidos',
    promotions: 'Promoções',
    reservations: 'Reservas',
    comments: 'Comentários',
    permissions: 'Permissões',
    groups: 'Grupos',
    audit: 'Auditoria',
    requests: 'Solicitações',
    attachments: 'Anexos',
    companies: 'Empresas',
    employees: 'Funcionários',
    departments: 'Departamentos',
    positions: 'Cargos',
    absences: 'Ausências',
    vacations: 'Férias',
    'time-entries': 'Registros de Ponto',
    overtime: 'Horas Extras',
    payroll: 'Folha de Pagamento',
    bonuses: 'Bônus',
    deductions: 'Deduções',
    'fiscal-settings': 'Configurações Fiscais',
    stakeholders: 'Sócios',
    'work-schedules': 'Jornadas de Trabalho',
    'time-bank': 'Banco de Horas',
    'vacation-periods': 'Períodos de Férias',
    addresses: 'Endereços',
    cnaes: 'CNAEs',
    'company-addresses': 'Endereços da Empresa',
    'company-cnaes': 'CNAEs da Empresa',
    'company-fiscal-settings': 'Configurações Fiscais da Empresa',
    'company-stakeholder': 'Sócios da Empresa',
    payrolls: 'Folhas de Pagamento',
    'time-control': 'Controle de Ponto',
    assignments: 'Atribuições',
    associations: 'Associações',
    'user-groups': 'Grupos de Usuários',
    'user-permissions': 'Permissões de Usuários',
    logs: 'Logs',
    history: 'Histórico',
    rollback: 'Rollback',
    compare: 'Comparação',
    notifications: 'Notificações',
    preferences: 'Preferências',
    volumes: 'Volumes',
  };

  const actionName = actionNames[action] || action;
  const resourceName = resourceNames[resource] || resource;

  return `${actionName} ${resourceName}`;
}

/**
 * Options for creating an authenticated user
 */
export interface CreateUserOptions {
  /**
   * TenantId para vincular o usuário e obter um token com escopo de tenant.
   * Se fornecido:
   * - Cria uma associação TenantUser entre o usuário e o tenant
   * - Após o login, chama POST /v1/auth/select-tenant para obter um JWT com tenantId
   * - O token retornado será tenant-scoped
   *
   * Se não fornecido, o token retornado NÃO terá tenantId (comportamento padrão).
   *
   * @example
   * const { tenantId } = await createAndSetupTenant();
   * const { token } = await createAndAuthenticateUser(app, { tenantId });
   */
  tenantId?: string;

  /**
   * Permissões específicas para dar ao usuário.
   * - Se não fornecido (undefined): dá TODAS as permissões (comportamento padrão)
   * - Se array vazio ([]): não dá nenhuma permissão (útil para testar 403)
   * - Se array com códigos: dá apenas as permissões listadas
   *
   * @example
   * // Todas as permissões (padrão)
   * createAndAuthenticateUser(app)
   *
   * // Permissões específicas
   * createAndAuthenticateUser(app, { permissions: ['hr.employees.create'] })
   *
   * // Sem permissões (para testar 403)
   * createAndAuthenticateUser(app, { permissions: [] })
   */
  permissions?: string[];
}

/**
 * Create all permissions and assign them to admin group for E2E tests
 */
async function setupAllPermissions(userId: string): Promise<void> {
  // Generate all permissions from the configuration
  const permissionsToCreate: Array<{
    code: string;
    name: string;
    description: string;
    module: string;
    resource: string;
    action: string;
  }> = [];

  for (const [module, resources] of Object.entries(ALL_PERMISSIONS)) {
    for (const [resource, actions] of Object.entries(resources)) {
      for (const action of actions) {
        const code = generatePermissionCode(module, resource, action);
        const name = generatePermissionName(module, resource, action);
        permissionsToCreate.push({
          code,
          name,
          description: `Permissão para ${name.toLowerCase()} no módulo ${module}`,
          module,
          resource,
          action,
        });
      }
    }
  }

  // Create all permissions in batch (skip duplicates for parallel-safe tests)
  await prisma.permission.createMany({
    data: permissionsToCreate.map((perm) => ({
      ...perm,
      isSystem: true,
    })),
    skipDuplicates: true,
  });

  // Get or create admin group
  let adminGroup = await prisma.permissionGroup.findFirst({
    where: { slug: 'admin-test', deletedAt: null },
  });

  if (!adminGroup) {
    adminGroup = await prisma.permissionGroup.create({
      data: {
        name: 'Administrador de Testes',
        slug: 'admin-test',
        description: 'Acesso completo ao sistema para testes E2E',
        isSystem: true,
        isActive: true,
        color: '#DC2626',
        priority: 100,
      },
    });
  }

  // Get all permissions
  const allPermissions = await prisma.permission.findMany({
    select: { id: true },
  });

  // Assign all permissions to admin group using upsert
  for (const permission of allPermissions) {
    await prisma.permissionGroupPermission.upsert({
      where: {
        groupId_permissionId: {
          groupId: adminGroup.id,
          permissionId: permission.id,
        },
      },
      update: { effect: 'allow' },
      create: {
        groupId: adminGroup.id,
        permissionId: permission.id,
        effect: 'allow',
      },
    });
  }

  // Assign user to admin group
  await prisma.userPermissionGroup.upsert({
    where: {
      userId_groupId: {
        userId,
        groupId: adminGroup.id,
      },
    },
    update: {},
    create: {
      userId,
      groupId: adminGroup.id,
    },
  });
}

/**
 * Setup specific permissions for a user (for testing specific permission scenarios)
 */
async function setupSpecificPermissions(
  userId: string,
  permissionCodes: string[],
): Promise<void> {
  if (permissionCodes.length === 0) {
    // No permissions - user will get 403 on any protected endpoint
    return;
  }

  // First ensure all required permissions exist in the database
  for (const code of permissionCodes) {
    const [module, resource, action] = code.split('.');
    const name = generatePermissionName(module, resource, action);

    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: {
        code,
        name,
        description: `Permissão para ${name.toLowerCase()} no módulo ${module}`,
        module,
        resource,
        action,
        isSystem: true,
      },
    });
  }

  // Get or create a test group for specific permissions
  const groupSlug = `test-specific-${userId.substring(0, 8)}`;
  let testGroup = await prisma.permissionGroup.findFirst({
    where: { slug: groupSlug, deletedAt: null },
  });

  if (!testGroup) {
    testGroup = await prisma.permissionGroup.create({
      data: {
        name: `Grupo de Teste ${userId.substring(0, 8)}`,
        slug: groupSlug,
        description: 'Grupo com permissões específicas para teste E2E',
        isSystem: true,
        isActive: true,
        color: '#3B82F6',
        priority: 50,
      },
    });
  }

  // Get the specific permissions
  const permissions = await prisma.permission.findMany({
    where: { code: { in: permissionCodes } },
    select: { id: true },
  });

  // Assign only the specific permissions to the group
  for (const permission of permissions) {
    await prisma.permissionGroupPermission.upsert({
      where: {
        groupId_permissionId: {
          groupId: testGroup.id,
          permissionId: permission.id,
        },
      },
      update: { effect: 'allow' },
      create: {
        groupId: testGroup.id,
        permissionId: permission.id,
        effect: 'allow',
      },
    });
  }

  // Assign user to the test group
  await prisma.userPermissionGroup.upsert({
    where: {
      userId_groupId: {
        userId,
        groupId: testGroup.id,
      },
    },
    update: {},
    create: {
      userId,
      groupId: testGroup.id,
    },
  });
}

export async function createAndAuthenticateUser(
  app: FastifyInstance,
  options?: CreateUserOptions,
) {
  const uniqueId = Math.random().toString(36).substring(2, 10);
  const fakeEmail = `test${uniqueId}@test.com`;
  const username = `user${uniqueId}`;

  const createUserUseCase = makeCreateUserUseCase();
  const userResponse = await createUserUseCase.execute({
    email: fakeEmail,
    password: 'Pass@123',
    username,
  });

  const userId = userResponse.user.id;

  // organizationId is deprecated - Employee now uses tenantId
  // The tenantId option handles associating users with tenants

  // Se tenantId foi fornecido, associar o user ao tenant
  if (options?.tenantId) {
    // Verify if association already exists (active, not deleted)
    const existingTenantUser = await prisma.tenantUser.findFirst({
      where: {
        tenantId: options.tenantId,
        userId,
        deletedAt: null,
      },
    });

    if (!existingTenantUser) {
      await prisma.tenantUser.create({
        data: {
          tenantId: options.tenantId,
          userId,
          role: 'ADMIN',
        },
      });
    }
  }

  // Setup permissions based on options
  if (options?.permissions !== undefined) {
    // Specific permissions provided (can be empty array for no permissions)
    await setupSpecificPermissions(userId, options.permissions);
  } else {
    // Default behavior: give all permissions
    await setupAllPermissions(userId);
  }

  const authResponse = await request(app.server)
    .post('/v1/auth/login/password')
    .send({
      email: fakeEmail,
      password: 'Pass@123',
    });

  let { token } = authResponse.body;
  let { refreshToken, sessionId } = authResponse.body;

  if (!refreshToken) {
    const setCookie = authResponse.headers['set-cookie'] ?? [];
    const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
    const refreshCookie = cookies.find((cookie) =>
      cookie.startsWith('refreshToken='),
    );
    if (refreshCookie) {
      refreshToken = refreshCookie.split(';')[0].replace('refreshToken=', '');
    }
  }

  if (!refreshToken || refreshToken.length < 16) {
    throw new Error(
      `Refresh token inválido no auth response: ${JSON.stringify({
        status: authResponse.status,
        body: authResponse.body,
        setCookie: authResponse.headers['set-cookie'],
      })}`,
    );
  }

  // Se tenantId foi fornecido, selecionar o tenant para obter um token com escopo de tenant
  if (options?.tenantId) {
    const selectTenantResponse = await request(app.server)
      .post('/v1/auth/select-tenant')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tenantId: options.tenantId,
      });

    token = selectTenantResponse.body.token;
  }

  return {
    user: userResponse,
    token,
    refreshToken,
    sessionId,
  };
}

// Helper function to generate CPF for testing
function generateCPF(): string {
  const n1 = Math.floor(Math.random() * 10);
  const n2 = Math.floor(Math.random() * 10);
  const n3 = Math.floor(Math.random() * 10);
  const n4 = Math.floor(Math.random() * 10);
  const n5 = Math.floor(Math.random() * 10);
  const n6 = Math.floor(Math.random() * 10);
  const n7 = Math.floor(Math.random() * 10);
  const n8 = Math.floor(Math.random() * 10);
  const n9 = Math.floor(Math.random() * 10);

  let d1 =
    n9 * 2 +
    n8 * 3 +
    n7 * 4 +
    n6 * 5 +
    n5 * 6 +
    n4 * 7 +
    n3 * 8 +
    n2 * 9 +
    n1 * 10;
  d1 = 11 - (d1 % 11);
  if (d1 >= 10) d1 = 0;

  let d2 =
    d1 * 2 +
    n9 * 3 +
    n8 * 4 +
    n7 * 5 +
    n6 * 6 +
    n5 * 7 +
    n4 * 8 +
    n3 * 9 +
    n2 * 10 +
    n1 * 11;
  d2 = 11 - (d2 % 11);
  if (d2 >= 10) d2 = 0;

  return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${d1}${d2}`;
}
