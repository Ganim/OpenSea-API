import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { prisma } from '@/lib/prisma';
import { TenantContextService } from '@/services/tenant/tenant-context-service';
import type { FastifyRequest } from 'fastify';

type PlanResource = 'users' | 'products' | 'warehouses';

const RESOURCE_CONFIG: Record<
  PlanResource,
  {
    limitKey: 'maxUsers' | 'maxProducts' | 'maxWarehouses';
    label: string;
    countFn: (tenantId: string) => Promise<number>;
  }
> = {
  users: {
    limitKey: 'maxUsers',
    label: 'usuários',
    countFn: (tenantId) =>
      prisma.tenantUser.count({
        where: { tenantId, deletedAt: null },
      }),
  },
  products: {
    limitKey: 'maxProducts',
    label: 'produtos',
    countFn: (tenantId) =>
      prisma.product.count({
        where: { tenantId, deletedAt: null },
      }),
  },
  warehouses: {
    limitKey: 'maxWarehouses',
    label: 'armazéns',
    countFn: (tenantId) =>
      prisma.warehouse.count({
        where: { tenantId, deletedAt: null },
      }),
  },
};

/**
 * Factory that creates a middleware to enforce plan resource limits.
 * Returns 403 Forbidden when the tenant has reached the limit.
 *
 * Must be placed AFTER verifyJwt and verifyTenant in the preHandler chain.
 *
 * @param resource - The resource type to check ('users' | 'products' | 'warehouses')
 *
 * @example
 * ```typescript
 * preHandler: [
 *   verifyJwt,
 *   verifyTenant,
 *   createPlanLimitsMiddleware('products'),
 *   createPermissionMiddleware({ permissionCode: 'stock.products.create' }),
 * ]
 * ```
 */
export function createPlanLimitsMiddleware(resource: PlanResource) {
  const config = RESOURCE_CONFIG[resource];

  return async function verifyPlanLimits(request: FastifyRequest) {
    if (!request.user) return;

    const tenantId = request.user.tenantId;
    if (!tenantId) {
      throw new ForbiddenError('Nenhum tenant selecionado.');
    }

    const tenantContextService = new TenantContextService();
    const plan = await tenantContextService.getTenantPlan(tenantId);

    if (!plan) {
      throw new ForbiddenError(
        'Sua empresa não possui um plano ativo. Contate o administrador.',
      );
    }

    const maxAllowed = plan.limits[config.limitKey];
    const currentCount = await config.countFn(tenantId);

    if (currentCount >= maxAllowed) {
      throw new ForbiddenError(
        `Limite do plano atingido: sua empresa pode ter no máximo ${maxAllowed} ${config.label}. ` +
          `Atualmente há ${currentCount}. Solicite um upgrade de plano para adicionar mais.`,
      );
    }
  };
}
