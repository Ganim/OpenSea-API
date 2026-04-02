import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListPosSessionsUseCase } from '@/use-cases/sales/pos-sessions/factories/make-list-pos-sessions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const listSessionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  terminalId: z.string().uuid().optional(),
  operatorId: z.string().uuid().optional(),
  status: z.enum(['OPEN', 'CLOSED', 'SUSPENDED']).optional(),
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

export async function listSessionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/pos/sessions',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CASHIER.ACCESS,
        resource: 'pos-sessions',
      }),
    ],
    schema: {
      tags: ['Sales - POS'],
      summary: 'List POS sessions',
      querystring: listSessionsQuerySchema,
      response: {
        200: z.object({
          sessions: z.array(sessionResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, limit, terminalId, operatorId, status } = request.query;

      const listPosSessionsUseCase = makeListPosSessionsUseCase();
      const { sessions, total, totalPages } =
        await listPosSessionsUseCase.execute({
          tenantId,
          page,
          limit,
          terminalId,
          operatorUserId: operatorId,
          status,
        });

      const sessionResponses = sessions.map((session) => ({
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
      }));

      return reply.status(200).send({
        sessions: sessionResponses,
        meta: { total, page, limit, pages: totalPages },
      } as unknown);
    },
  });
}
