import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { posSessionResponseSchema } from '@/http/schemas/sales/pos/pos-session.schema';
import { posSessionToDTO } from '@/mappers/sales/pos-session/pos-session-to-dto';
import { makeListPosSessionsUseCase } from '@/use-cases/sales/pos-sessions/factories/make-list-pos-sessions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1ListSessionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/pos/sessions',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.SESSIONS.ACCESS,
        resource: 'pos-sessions',
      }),
    ],
    schema: {
      tags: ['POS - Sessions'],
      summary: 'List POS sessions',
      querystring: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        terminalId: z.string().uuid().optional(),
        status: z.string().optional(),
        operatorUserId: z.string().uuid().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
      }),
      response: {
        200: z.object({
          data: z.array(posSessionResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const query = request.query;

      const useCase = makeListPosSessionsUseCase();
      const result = await useCase.execute({ tenantId, ...query });

      return reply.send({
        data: result.sessions.map(posSessionToDTO),
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: result.totalPages,
        },
      });
    },
  });
}
