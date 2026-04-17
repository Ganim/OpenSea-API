import { PermissionCodes } from '@/constants/rbac';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ErrorCodes } from '@/@errors/error-codes';
import { errorResponseSchema } from '@/http/schemas/common/error-response.schema';

export async function deletePeriodLockController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/finance/period-locks/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.PERIOD_LOCKS.REMOVE,
        resource: 'period-locks',
      }),
    ],
    schema: {
      tags: ['Finance - Period Locks'],
      summary: 'Release a locked period',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ released: z.literal(true) }),
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id } = request.params as { id: string };

      const lock = await prisma.financePeriodLock.findFirst({
        where: { id, tenantId },
      });

      if (!lock) {
        return reply.status(404).send({
          code: ErrorCodes.RESOURCE_NOT_FOUND,
          message: 'Lock not found',
          requestId: request.requestId,
        });
      }

      await prisma.financePeriodLock.update({
        where: { id: lock.id },
        data: { releasedAt: new Date(), releasedBy: userId },
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.FINANCE.PERIOD_LOCK_RELEASE,
        entityId: lock.id,
        placeholders: {
          userName: userId,
          period: `${String(lock.month).padStart(2, '0')}/${lock.year}`,
        },
        newData: { releasedAt: new Date().toISOString() },
      });

      return reply.status(200).send({ released: true });
    },
  });
}
