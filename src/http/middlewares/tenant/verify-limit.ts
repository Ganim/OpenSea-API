import { prisma } from '@/lib/prisma';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Factory that creates a middleware to check consumption-based limits
 * for a given metric (e.g. "api_requests", "storage_bytes", "emails_sent").
 *
 * Unlike `createPlanLimitsMiddleware` (which checks static plan caps like
 * maxUsers / maxProducts), this middleware checks dynamic, period-based
 * consumption tracked in `TenantConsumption`.
 *
 * Must be placed AFTER verifyJwt and verifyTenant in the preHandler chain.
 *
 * @param metric - The consumption metric identifier to check.
 *
 * @example
 * ```typescript
 * preHandler: [
 *   verifyJwt,
 *   verifyTenant,
 *   verifyLimit('emails_sent'),
 * ]
 * ```
 */
export function verifyLimit(metric: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantId = (request as any).tenantId ?? request.user?.tenantId;
    if (!tenantId) return; // No tenant context, skip

    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const consumption = await prisma.tenantConsumption.findUnique({
      where: {
        tenantId_period_metric: { tenantId, period, metric },
      },
    });

    if (!consumption) return; // No consumption record, no limit
    if (consumption.limit === null) return; // Unlimited

    if (consumption.quantity >= consumption.limit) {
      return reply.status(429).send({
        message: `Limite atingido para ${metric}. Upgrade seu plano para continuar.`,
        metric,
        used: consumption.quantity,
        limit: consumption.limit,
      });
    }
  };
}
