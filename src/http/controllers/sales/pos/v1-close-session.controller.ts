import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeClosePosSessionUseCase } from '@/use-cases/sales/pos-sessions/factories/make-close-pos-session-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const closeSessionBodySchema = z.object({
  closingBalance: z.number().min(0),
  closingBreakdown: z
    .object({
      cash: z.number().min(0).optional(),
      creditCard: z.number().min(0).optional(),
      debitCard: z.number().min(0).optional(),
      pix: z.number().min(0).optional(),
      checks: z.number().min(0).optional(),
      other: z.number().min(0).optional(),
    })
    .optional(),
  notes: z.string().max(500).optional(),
});

const sessionResponseSchema = z.object({
  id: z.string().uuid(),
  terminalId: z.string().uuid(),
  operatorId: z.string().uuid(),
  status: z.string(),
  openingBalance: z.number(),
  closingBalance: z.number().nullable(),
  notes: z.string().nullable(),
  openedAt: z.string(),
  closedAt: z.string().nullable(),
  tenantId: z.string().uuid(),
  createdAt: z.string(),
});

export async function closeSessionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/pos/sessions/:sessionId/close',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CASHIER.CLOSE,
        resource: 'pos-sessions',
      }),
    ],
    schema: {
      tags: ['Sales - POS'],
      summary: 'Close a POS session',
      params: z.object({
        sessionId: z.string().uuid().describe('Session UUID'),
      }),
      body: closeSessionBodySchema,
      response: {
        200: z.object({ session: sessionResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { sessionId } = request.params;
      const body = request.body;

      try {
        const closePosSessionUseCase = makeClosePosSessionUseCase();
        const { session } = await closePosSessionUseCase.execute({
          tenantId,
          sessionId,
          userId,
          closingBalance: body.closingBalance,
          closingBreakdown: body.closingBreakdown,
          notes: body.notes,
        });

        const sessionResponse = {
          id: session.id.toString(),
          terminalId: session.terminalId.toString(),
          operatorId: session.operatorUserId.toString(),
          status: session.status,
          openingBalance: session.openingBalance,
          closingBalance: session.closingBalance ?? null,
          notes: session.notes ?? null,
          openedAt: session.openedAt.toISOString(),
          closedAt: session.closedAt?.toISOString() ?? null,
          tenantId: session.tenantId.toString(),
          createdAt: session.createdAt.toISOString(),
        };

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.POS_SESSION_CLOSE,
          entityId: sessionId,
          placeholders: { userName: userId, sessionId },
          newData: {
            closingBalance: body.closingBalance,
            closingBreakdown: body.closingBreakdown,
          },
        });

        return reply.status(200).send({ session: sessionResponse } as unknown);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
