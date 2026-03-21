import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const closeSessionBodySchema = z.object({
  closingBalance: z.number().min(0),
  closingBreakdown: z
    .object({
      cash: z.number().min(0).optional(),
      credit: z.number().min(0).optional(),
      debit: z.number().min(0).optional(),
      pix: z.number().min(0).optional(),
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

      // TODO: Replace stub with real use case
      const session = {
        id: sessionId,
        terminalId: crypto.randomUUID(),
        operatorId: userId,
        status: 'CLOSED',
        openingBalance: 0,
        closingBalance: body.closingBalance,
        notes: body.notes ?? null,
        openedAt: new Date().toISOString(),
        closedAt: new Date().toISOString(),
        tenantId,
        createdAt: new Date().toISOString(),
      };

      await logAudit(request, {
        message: 'POS session closed: {sessionId}',
        entityId: sessionId,
        placeholders: { userName: userId, sessionId },
        newData: { closingBalance: body.closingBalance, closingBreakdown: body.closingBreakdown },
      });

      return reply.status(200).send({ session });
    },
  });
}
