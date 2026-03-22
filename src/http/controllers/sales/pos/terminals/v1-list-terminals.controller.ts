import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { posTerminalResponseSchema } from '@/http/schemas/sales/pos/pos-terminal.schema';
import { posTerminalToDTO } from '@/mappers/sales/pos-terminal/pos-terminal-to-dto';
import { makeListPosTerminalsUseCase } from '@/use-cases/sales/pos-terminals/factories/make-list-pos-terminals-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1ListTerminalsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/pos/terminals',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.TERMINALS.ACCESS,
        resource: 'pos-terminals',
      }),
    ],
    schema: {
      tags: ['POS - Terminals'],
      summary: 'List POS terminals',
      querystring: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        search: z.string().optional(),
        mode: z.string().optional(),
        isActive: z.coerce.boolean().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
      }),
      response: {
        200: z.object({
          data: z.array(posTerminalResponseSchema),
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

      const useCase = makeListPosTerminalsUseCase();
      const result = await useCase.execute({ tenantId, ...query });

      return reply.send({
        data: result.terminals.map(posTerminalToDTO),
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
