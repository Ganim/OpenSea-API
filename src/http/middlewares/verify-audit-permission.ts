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
 * Middleware para verificar permissões de audit
 *
 * Permissões necessárias:
 * - audit.logs.view - Ver logs de auditoria
 * - audit.rollback.preview - Visualizar preview de rollback
 * - audit.history.view - Ver histórico de entidades
 * - audit.compare.view - Comparar versões
 */

interface PermissionCheck {
  permissionCode: string;
  resource?: string;
}

export function createAuditPermissionMiddleware(check: PermissionCheck) {
  return async function verifyAuditPermission(request: FastifyRequest) {
    const user = request.user as any;

    if (!user || !user.sub) {
      throw new UnauthorizedError('User not authenticated');
    }

    // Criar instância do PermissionService
    const permissionsRepository = new PrismaPermissionsRepository();
    const permissionGroupsRepository = new PrismaPermissionGroupsRepository();
    const permissionGroupPermissionsRepository =
      new PrismaPermissionGroupPermissionsRepository();
    const userPermissionGroupsRepository =
      new PrismaUserPermissionGroupsRepository();
    const permissionAuditLogsRepository =
      new PrismaPermissionAuditLogsRepository();

    const permissionService = new PermissionService(
      permissionsRepository,
      permissionGroupsRepository,
      permissionGroupPermissionsRepository,
      userPermissionGroupsRepository,
      permissionAuditLogsRepository,
    );

    // Verificar permissão
    const result = await permissionService.checkPermission({
      userId: new UniqueEntityID(user.sub),
      permissionCode: check.permissionCode,
      resource: check.resource,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      endpoint: request.url,
    });

    if (!result.allowed) {
      throw new ForbiddenError(
        `Permission denied: ${check.permissionCode}. Reason: ${result.reason}`,
      );
    }
  };
}

// Middlewares específicos para cada endpoint de audit
export const verifyAuditLogsViewPermission = createAuditPermissionMiddleware({
  permissionCode: 'audit.logs.view',
  resource: 'audit_logs',
});

export const verifyAuditRollbackPreviewPermission =
  createAuditPermissionMiddleware({
    permissionCode: 'audit.rollback.preview',
    resource: 'audit_logs',
  });

export const verifyAuditHistoryViewPermission = createAuditPermissionMiddleware(
  {
    permissionCode: 'audit.history.view',
    resource: 'audit_logs',
  },
);

export const verifyAuditComparePermission = createAuditPermissionMiddleware({
  permissionCode: 'audit.compare.view',
  resource: 'audit_logs',
});
