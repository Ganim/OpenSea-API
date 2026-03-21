import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { listActionLogsQuerySchema, actionLogResponseSchema } from '@/http/schemas/ai';
import { makeListActionLogsUseCase } from '@/use-cases/ai/actions/factories/make-list-action-logs-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listActionLogsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/ai/actions',
    onRequest: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Actions'],
      summary: 'List AI action logs',
      security: [{ bearerAuth: [] }],
      querystring: listActionLogsQuerySchema,
      response: {
        200: z.object({
          actions: z.array(actionLogResponseSchema),
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

      const useCase = makeListActionLogsUseCase();
      const result = await useCase.execute({
        tenantId,
        ...request.query,
      });

      return reply.status(200).send(result);
    },
  });
}
