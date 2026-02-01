import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { TenantContextService } from '@/services/tenant/tenant-context-service';
import type { FastifyRequest } from 'fastify';

/**
 * Factory that creates a middleware to verify if a feature flag
 * is enabled for the current tenant.
 *
 * Must be placed AFTER verifyJwt and verifyTenant in the preHandler chain.
 *
 * @param flag - The feature flag name to check (e.g., 'new-dashboard', 'bulk-import')
 * @returns Fastify preHandler middleware
 *
 * @example
 * ```typescript
 * preHandler: [
 *   verifyJwt,
 *   verifyTenant,
 *   createFeatureFlagMiddleware('bulk-import'),
 * ]
 * ```
 */
export function createFeatureFlagMiddleware(flag: string) {
  return async function verifyFeatureFlag(request: FastifyRequest) {
    const tenantId = request.user.tenantId;

    if (!tenantId) {
      throw new ForbiddenError('No tenant selected');
    }

    const tenantContextService = new TenantContextService();
    const isEnabled = await tenantContextService.isFeatureEnabled(
      tenantId,
      flag,
    );

    if (!isEnabled) {
      throw new ForbiddenError(
        `Feature '${flag}' is not enabled for your organization.`,
      );
    }
  };
}
