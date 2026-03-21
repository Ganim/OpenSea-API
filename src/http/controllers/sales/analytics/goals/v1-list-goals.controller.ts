import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListGoalsUseCase } from '@/use-cases/sales/analytics/goals/factories/make-list-goals-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listGoalsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/analytics/goals',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Sales - Analytics Goals'],
      summary: 'List analytics goals',
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        perPage: z.coerce.number().int().positive().max(100).default(20),
        status: z.enum(['ACTIVE', 'ACHIEVED', 'MISSED', 'ARCHIVED']).optional(),
        type: z.string().optional(),
        scope: z.enum(['INDIVIDUAL', 'TEAM', 'TENANT']).optional(),
        userId: z.string().uuid().optional(),
      }),
      response: {
        200: z.object({
          goals: z.array(z.any()),
          total: z.number(),
          page: z.number(),
          perPage: z.number(),
          totalPages: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const query = request.query;

      const useCase = makeListGoalsUseCase();
      const result = await useCase.execute({ tenantId, ...query });

      return reply.status(200).send(result);
    },
  });
}
