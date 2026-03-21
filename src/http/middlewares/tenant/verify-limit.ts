import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { prisma } from '@/lib/prisma';
import type { FastifyRequest } from 'fastify';

/**
 * Factory that creates a middleware to check if a tenant has reached
 * their usage limit for a specific consumption metric before allowing the action.
 *
 * Must be placed AFTER verifyJwt and verifyTenant in the preHandler chain.
 *
 * Note: This middleware only CHECKS the limit. The actual usage increment
 * should happen in the use case after the action succeeds.
 *
 * @param metric - The consumption metric to check (e.g., 'deals', 'invoices', 'api_calls')
 * @returns Fastify preHandler middleware
 *
 * @example
 * ```typescript
 * preHandler: [
 *   verifyJwt,
 *   verifyTenant,
 *   verifyLimit('deals'),
 * ]
 * ```
 */
export function verifyLimit(metric: string) {
  return async function verifyLimitHandler(request: FastifyRequest) {
    if (!request.user) return;

    const tenantId = request.user.tenantId;

    if (!tenantId) {
      throw new ForbiddenError('Nenhum tenant selecionado.');
    }

    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const consumption = await prisma.tenantConsumption.findUnique({
      where: {
        tenantId_period_metric: {
          tenantId,
          period: currentPeriod,
          metric,
        },
      },
    });

    // No consumption record exists — no limit configured, allow
    if (!consumption) return;

    // No limit set — unlimited, allow
    if (consumption.limit === null) return;

    // Check if usage has reached the limit
    if (consumption.used >= consumption.limit) {
      throw new ForbiddenError(
        `Limite atingido para ${metric}. Upgrade seu plano.`,
      );
    }
  };
}
