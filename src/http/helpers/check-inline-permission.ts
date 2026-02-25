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
 * Checks a permission inline within a handler (not as middleware).
 * Useful when the required permission depends on runtime data (e.g., folder type).
 *
 * Throws ForbiddenError if the user lacks the permission.
 */
export async function checkInlinePermission(
  request: FastifyRequest,
  permissionCode: string,
): Promise<void> {
  const user = request.user as { sub?: string } | undefined;

  if (!user || !user.sub) {
    throw new UnauthorizedError('User not authenticated');
  }

  const permissionService = new PermissionService(
    new PrismaPermissionsRepository(),
    new PrismaPermissionGroupsRepository(),
    new PrismaPermissionGroupPermissionsRepository(),
    new PrismaUserPermissionGroupsRepository(),
    new PrismaPermissionAuditLogsRepository(),
  );

  const result = await permissionService.checkPermission({
    userId: new UniqueEntityID(user.sub),
    permissionCode,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
    endpoint: request.url,
  });

  if (!result.allowed) {
    throw new ForbiddenError(
      `Permission denied: ${permissionCode}. ${result.reason}`,
    );
  }
}
