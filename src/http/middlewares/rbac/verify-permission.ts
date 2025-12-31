import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PrismaPermissionAuditLogsRepository } from '@/repositories/rbac/prisma/prisma-permission-audit-logs-repository';
import { PrismaPermissionGroupPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permission-group-permissions-repository';
import { PrismaPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-permission-groups-repository';
import { PrismaPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permissions-repository';
import { PrismaUserPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-user-permission-groups-repository';
import { PermissionService } from '@/services/rbac/permission-service';
import type { FastifyRequest } from 'fastify';

/**
 * Opções para verificação de permissão
 */
export interface PermissionCheckOptions {
  /**
   * Código da permissão necessária
   * Exemplo: 'stock.products.create', 'core.users.manage'
   */
  permissionCode: string;

  /**
   * Nome do recurso (opcional, para auditoria)
   * Exemplo: 'products', 'users'
   */
  resource?: string;

  /**
   * ID do recurso específico (opcional, para ABAC futuro)
   * Exemplo: 'product-123', 'user-456'
   */
  resourceId?: string;
}

/**
 * Factory para criar middleware de verificação de permissão única
 *
 * Cria um middleware que verifica se o usuário autenticado possui
 * a permissão especificada. Lança ForbiddenError se não tiver.
 *
 * @param options - Opções de verificação de permissão
 * @returns Middleware do Fastify
 *
 * @example
 * ```typescript
 * import { createPermissionMiddleware } from '@/middlewares/rbac/verify-permission';
 * import { PermissionCodes } from '@/constants/rbac/permission-codes';
 *
 * const checkProductCreate = createPermissionMiddleware({
 *   permissionCode: PermissionCodes.STOCK.PRODUCTS.CREATE,
 *   resource: 'products'
 * });
 *
 * // Usar em rota
 * app.route({
 *   method: 'POST',
 *   url: '/products',
 *   preHandler: [verifyJwt, checkProductCreate],
 *   handler: async (request, reply) => { ... }
 * });
 * ```
 */
export function createPermissionMiddleware(options: PermissionCheckOptions) {
  return async function verifyPermission(request: FastifyRequest) {
    const user = request.user as { sub?: string } | undefined;

    if (!user || !user.sub) {
      throw new UnauthorizedError('User not authenticated');
    }

    const permissionService = createPermissionServiceInstance();

    const result = await permissionService.checkPermission({
      userId: new UniqueEntityID(user.sub),
      permissionCode: options.permissionCode,
      resource: options.resource,
      resourceId: options.resourceId,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      endpoint: request.url,
    });

    if (!result.allowed) {
      throw new ForbiddenError(
        `Permission denied: ${options.permissionCode}. ${result.reason}`,
      );
    }
  };
}

/**
 * Factory para criar middleware que verifica múltiplas permissões (OR)
 *
 * Cria um middleware que verifica se o usuário possui QUALQUER UMA
 * das permissões listadas. Útil para endpoints que aceitam múltiplos
 * níveis de acesso.
 *
 * @param permissionCodes - Array de códigos de permissão
 * @returns Middleware do Fastify
 *
 * @example
 * ```typescript
 * // Permite acesso a quem tem permissão de create OU manage
 * const checkProductAccess = createAnyPermissionMiddleware([
 *   PermissionCodes.STOCK.PRODUCTS.CREATE,
 *   PermissionCodes.STOCK.PRODUCTS.MANAGE,
 * ]);
 * ```
 */
export function createAnyPermissionMiddleware(permissionCodes: string[]) {
  return async function verifyAnyPermission(request: FastifyRequest) {
    const user = request.user as { sub?: string } | undefined;

    if (!user || !user.sub) {
      throw new UnauthorizedError('User not authenticated');
    }

    const permissionService = createPermissionServiceInstance();
    const userId = new UniqueEntityID(user.sub);

    // Testar cada permissão
    for (const code of permissionCodes) {
      const result = await permissionService.checkPermission({
        userId,
        permissionCode: code,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        endpoint: request.url,
      });

      if (result.allowed) {
        return; // Tem pelo menos uma permissão, permite acesso
      }
    }

    // Nenhuma permissão foi concedida
    throw new ForbiddenError(
      `Permission denied: requires any of [${permissionCodes.join(', ')}]`,
    );
  };
}

/**
 * Factory para criar middleware que verifica múltiplas permissões (AND)
 *
 * Cria um middleware que verifica se o usuário possui TODAS
 * as permissões listadas. Útil para endpoints que requerem
 * múltiplas permissões simultaneamente.
 *
 * @param permissionCodes - Array de códigos de permissão
 * @returns Middleware do Fastify
 *
 * @example
 * ```typescript
 * // Requer tanto permissão de create quanto de approve
 * const checkProductCreateAndApprove = createAllPermissionsMiddleware([
 *   PermissionCodes.STOCK.PRODUCTS.CREATE,
 *   PermissionCodes.STOCK.PRODUCTS.APPROVE,
 * ]);
 * ```
 */
export function createAllPermissionsMiddleware(permissionCodes: string[]) {
  return async function verifyAllPermissions(request: FastifyRequest) {
    const user = request.user as { sub?: string } | undefined;

    if (!user || !user.sub) {
      throw new UnauthorizedError('User not authenticated');
    }

    const permissionService = createPermissionServiceInstance();
    const userId = new UniqueEntityID(user.sub);
    const deniedPermissions: string[] = [];

    // Testar todas as permissões
    for (const code of permissionCodes) {
      const result = await permissionService.checkPermission({
        userId,
        permissionCode: code,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        endpoint: request.url,
      });

      if (!result.allowed) {
        deniedPermissions.push(code);
      }
    }

    if (deniedPermissions.length > 0) {
      throw new ForbiddenError(
        `Permission denied: missing required permissions [${deniedPermissions.join(', ')}]`,
      );
    }
  };
}

/**
 * Helper para criar instância do PermissionService
 * Evita duplicação de código ao instanciar repositórios
 *
 * @private
 */
function createPermissionServiceInstance(): PermissionService {
  const permissionsRepository = new PrismaPermissionsRepository();
  const permissionGroupsRepository = new PrismaPermissionGroupsRepository();
  const permissionGroupPermissionsRepository =
    new PrismaPermissionGroupPermissionsRepository();
  const userPermissionGroupsRepository =
    new PrismaUserPermissionGroupsRepository();
  const permissionAuditLogsRepository =
    new PrismaPermissionAuditLogsRepository();

  return new PermissionService(
    permissionsRepository,
    permissionGroupsRepository,
    permissionGroupPermissionsRepository,
    userPermissionGroupsRepository,
    permissionAuditLogsRepository,
  );
}
