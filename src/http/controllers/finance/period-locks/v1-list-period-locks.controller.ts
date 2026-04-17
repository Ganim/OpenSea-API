import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { prisma } from '@/lib/prisma';
// P2-49: shared period-lock schema keeps the date shape consistent with
// the create controller (both use z.coerce.date()).
import { periodLockSchema } from '@/http/schemas/finance/period-locks/period-lock.schema';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listPeriodLocksController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/period-locks',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.PERIOD_LOCKS.ACCESS,
        resource: 'period-locks',
      }),
    ],
    schema: {
      tags: ['Finance - Period Locks'],
      summary: 'List period locks of the tenant',
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        year: z.coerce.number().int().min(2000).max(2100).optional(),
        activeOnly: z.coerce.boolean().optional(),
      }),
      response: {
        200: z.object({
          locks: z.array(periodLockSchema),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { year, activeOnly } = request.query as {
        year?: number;
        activeOnly?: boolean;
      };

      const locks = await prisma.financePeriodLock.findMany({
        where: {
          tenantId,
          ...(year !== undefined ? { year } : {}),
          ...(activeOnly ? { releasedAt: null } : {}),
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      });

      return reply.status(200).send({ locks });
    },
  });
}
