import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCreatePosCashMovementUseCase } from '@/use-cases/sales/pos-cash-movements/factories/make-create-pos-cash-movement-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const cashMovementBodySchema = z.object({
  sessionId: z.string().uuid(),
  type: z.enum(['WITHDRAWAL', 'SUPPLY']),
  amount: z.number().positive(),
  reason: z.string().min(1).max(500),
  authorizedByUserId: z.string().uuid().optional(),
});

const cashMovementResponseSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  performedByUserId: z.string().uuid(),
  type: z.string(),
  amount: z.number(),
  reason: z.string().nullable(),
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

      try {
        const createPosCashMovementUseCase = makeCreatePosCashMovementUseCase();
        const { movement } = await createPosCashMovementUseCase.execute({
          tenantId,
          sessionId: body.sessionId,
          type: body.type,
          amount: body.amount,
          reason: body.reason,
          performedByUserId: userId,
          authorizedByUserId: body.authorizedByUserId,
        });

        const movementResponse = {
          id: movement.id.toString(),
          sessionId: movement.sessionId.toString(),
          performedByUserId: movement.performedByUserId.toString(),
          type: movement.type,
          amount: movement.amount,
          reason: movement.reason ?? null,
          tenantId: movement.tenantId.toString(),
          createdAt: movement.createdAt.toISOString(),
        };

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.POS_CASH_MOVEMENT,
          entityId: movementResponse.id,
          placeholders: {
            userName: userId,
            type: body.type.toLowerCase(),
            amount: body.amount.toFixed(2),
          },
          newData: {
            sessionId: body.sessionId,
            type: body.type,
            amount: body.amount,
          },
        });

        return reply
          .status(201)
          .send({ movement: movementResponse } as unknown);
      } catch (error) {
        if (
          error instanceof BadRequestError ||
          error instanceof ResourceNotFoundError
        ) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
