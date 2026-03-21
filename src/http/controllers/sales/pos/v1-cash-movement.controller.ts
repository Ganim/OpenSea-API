import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const cashMovementBodySchema = z.object({
  sessionId: z.string().uuid(),
  type: z.enum(['WITHDRAW', 'SUPPLY']),
  amount: z.number().positive(),
  reason: z.string().min(1).max(500),
});

const cashMovementResponseSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  operatorId: z.string().uuid(),
  type: z.string(),
  amount: z.number(),
  reason: z.string(),
  tenantId: z.string().uuid(),
  createdAt: z.string(),
});

export async function cashMovementController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/pos/cash/movement',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CASHIER.WITHDRAW,
        resource: 'pos-cash',
      }),
    ],
    schema: {
      tags: ['Sales - POS'],
      summary: 'Register a cash movement (withdraw/supply)',
      body: cashMovementBodySchema,
      response: {
        201: z.object({ movement: cashMovementResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const body = request.body;

      // TODO: Replace stub with real use case
      const movement = {
        id: crypto.randomUUID(),
        sessionId: body.sessionId,
        operatorId: userId,
        type: body.type,
        amount: body.amount,
        reason: body.reason,
        tenantId,
        createdAt: new Date().toISOString(),
      };

      await logAudit(request, {
        message: 'POS cash {type}: R$ {amount}',
        entityId: movement.id,
        placeholders: {
          userName: userId,
          type: body.type.toLowerCase(),
          amount: body.amount.toFixed(2),
        },
        newData: { sessionId: body.sessionId, type: body.type, amount: body.amount },
      });

      return reply.status(201).send({ movement });
    },
  });
}
