import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const openSessionBodySchema = z.object({
  terminalId: z.string().uuid(),
  openingBalance: z.number().min(0),
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

export async function openSessionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/pos/sessions/open',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CASHIER.OPEN,
        resource: 'pos-sessions',
      }),
    ],
    schema: {
      tags: ['Sales - POS'],
      summary: 'Open a new POS session',
      body: openSessionBodySchema,
      response: {
        201: z.object({ session: sessionResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const body = request.body;

      // TODO: Replace stub with real use case
      const session = {
        id: crypto.randomUUID(),
        terminalId: body.terminalId,
        operatorId: userId,
        status: 'OPEN',
        openingBalance: body.openingBalance,
        closingBalance: null,
        notes: body.notes ?? null,
        openedAt: new Date().toISOString(),
        closedAt: null,
        tenantId,
        createdAt: new Date().toISOString(),
      };

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.POS_SESSION_OPEN,
        entityId: session.id,
        placeholders: { userName: userId, terminalId: body.terminalId },
        newData: {
          terminalId: body.terminalId,
          openingBalance: body.openingBalance,
        },
      });

      return reply.status(201).send({ session });
    },
  });
}
