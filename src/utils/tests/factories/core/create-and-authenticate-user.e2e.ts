import { prisma } from '@/lib/prisma';
import {
  ADMIN_TEST_GROUP_SLUG,
  generatePermissionName,
} from '@/utils/tests/e2e-permissions';
import { makeCreateUserUseCase } from '@/use-cases/core/users/factories/make-create-user-use-case';
import type { FastifyInstance } from 'fastify';

import request from 'supertest';

/** Cached admin group ID — avoids 1 findFirst per createAndAuthenticateUser call */
let cachedAdminGroupId: string | null = null;

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
 * Assigns user to the pre-seeded admin-test group.
 * Permissions and admin group are seeded once in vitest-setup-e2e.ts.
 * This reduces from ~757 queries to 1-2 queries per user.
 */
async function setupAllPermissions(userId: string): Promise<void> {
  if (!cachedAdminGroupId) {
    const adminGroup = await prisma.permissionGroup.findFirst({
      where: { slug: ADMIN_TEST_GROUP_SLUG, deletedAt: null },
    });

    if (!adminGroup) {
      throw new Error(
        `Admin test group "${ADMIN_TEST_GROUP_SLUG}" not found. ` +
          'Ensure vitest-setup-e2e.ts ran the permission seed.',
      );
    }

    cachedAdminGroupId = adminGroup.id;
  }

  await prisma.userPermissionGroup.upsert({
    where: {
      userId_groupId: {
        userId,
        groupId: cachedAdminGroupId,
      },
    },
    update: {},
    create: {
      userId,
      groupId: cachedAdminGroupId,
    },
  });
}

/**
 * Creates a specific permission group for this user with only the given permissions.
 * Permissions already exist in DB (seeded globally), so just find and assign.
 */
async function setupSpecificPermissions(
  userId: string,
  permissionCodes: string[],
): Promise<void> {
  if (permissionCodes.length === 0) {
    return; // No permissions — user will get 403
  }

  // Ensure the specific permissions exist (some tests use codes not in ALL_PERMISSIONS)
  for (const code of permissionCodes) {
    const parts = code.split('.');
    const module = parts[0];
    const resource = parts.slice(1, -1).join('.');
    const action = parts[parts.length - 1];
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

  // Create a unique group for this user's specific permissions
  const groupSlug = `test-specific-${userId.substring(0, 8)}`;

  const testGroup = await prisma.permissionGroup.create({
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

  // Find permission IDs and assign in batch
  const permissions = await prisma.permission.findMany({
    where: { code: { in: permissionCodes } },
    select: { id: true },
  });

  if (permissions.length > 0) {
    await prisma.permissionGroupPermission.createMany({
      data: permissions.map((p) => ({
        groupId: testGroup.id,
        permissionId: p.id,
        effect: 'allow' as const,
      })),
      skipDuplicates: true,
    });
  }

  await prisma.userPermissionGroup.create({
    data: {
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
  let { refreshToken } = authResponse.body;
  const { sessionId } = authResponse.body;

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
