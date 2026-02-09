import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { TenantContextService } from '@/services/tenant/tenant-context-service';
import type { FastifyRequest } from 'fastify';

export type SystemModule =
  | 'CORE'
  | 'STOCK'
  | 'SALES'
  | 'HR'
  | 'PAYROLL'
  | 'REPORTS'
  | 'AUDIT'
  | 'REQUESTS'
  | 'NOTIFICATIONS'
  | 'FINANCE';

/**
 * Factory that creates a middleware to verify if the tenant's plan
 * includes access to a specific system module.
 *
 * Must be placed AFTER verifyJwt and verifyTenant in the preHandler chain.
 *
 * @param module - The system module to check access for
 * @returns Fastify preHandler middleware
 *
 * @example
 * ```typescript
 * preHandler: [
 *   verifyJwt,
 *   verifyTenant,
 *   createModuleMiddleware('STOCK'),
 *   createPermissionMiddleware({ permissionCode: '...' }),
 * ]
 * ```
 */
export function createModuleMiddleware(module: SystemModule) {
  return async function verifyModule(request: FastifyRequest) {
    const tenantId = request.user.tenantId;

    if (!tenantId) {
      throw new ForbiddenError('No tenant selected');
    }

    const tenantContextService = new TenantContextService();
    const isEnabled = await tenantContextService.isModuleEnabled(
      tenantId,
      module,
    );

    if (!isEnabled) {
      throw new ForbiddenError(
        `Module '${module}' is not available in your current plan. Please upgrade your plan to access this feature.`,
      );
    }
  };
}
