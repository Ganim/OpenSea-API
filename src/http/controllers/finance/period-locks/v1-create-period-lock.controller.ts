import { PermissionCodes } from '@/constants/rbac';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { prisma } from '@/lib/prisma';
// P2-49: shared period-lock schema so create/list/delete responses agree
// on the date shape (z.coerce.date() everywhere).
import { periodLockSchema } from '@/http/schemas/finance/period-locks/period-lock.schema';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createPeriodLockController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/period-locks',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.PERIOD_LOCKS.REGISTER,
        resource: 'period-locks',
      }),
    ],
    schema: {
      tags: ['Finance - Period Locks'],
      summary: 'Lock a finance period (fechamento contábil)',
      security: [{ bearerAuth: [] }],
      body: z.object({
        year: z.number().int().min(2000).max(2100),
        month: z.number().int().min(1).max(12),
        reason: z.string().max(500).optional(),
      }),
      response: {
        201: z.object({
          lock: periodLockSchema,
        }),
        409: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { year, month, reason } = request.body as {
        year: number;
        month: number;
        reason?: string;
      };

      const existing = await prisma.financePeriodLock.findUnique({
        where: {
          finance_period_lock_unique: { tenantId, year, month },
        },
      });

      if (existing && existing.releasedAt === null) {
        return reply.status(409).send({
          message: `Período ${String(month).padStart(2, '0')}/${year} já está travado`,
        });
      }

      const lock = existing
        ? await prisma.financePeriodLock.update({
            where: { id: existing.id },
            data: {
              lockedBy: userId,
              lockedAt: new Date(),
              releasedBy: null,
              releasedAt: null,
              reason: reason ?? null,
            },
          })
        : await prisma.financePeriodLock.create({
            data: {
              tenantId,
              year,
              month,
              lockedBy: userId,
              reason: reason ?? null,
            },
          });

      await logAudit(request, {
        message: AUDIT_MESSAGES.FINANCE.PERIOD_LOCK_CREATE,
        entityId: lock.id,
        placeholders: {
          userName: userId,
          period: `${String(month).padStart(2, '0')}/${year}`,
        },
        newData: { year, month, reason },
      });

      return reply.status(201).send({ lock });
    },
  });
}
