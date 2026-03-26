import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { ListEsocialEventsUseCase } from '@/use-cases/hr/esocial/list-esocial-events';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { listEventsQuerySchema } from './esocial-api-schemas';

export async function v1ListEsocialEventsController(app: FastifyInstance) {
  const useCase = new ListEsocialEventsUseCase();

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/esocial/events',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - eSocial'],
      summary: 'List eSocial events',
      description: 'Lists eSocial events with filtering and pagination',
      querystring: listEventsQuerySchema,
      response: {
        200: z.any(),
        500: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const tenantId = request.user.tenantId!;
        const query = request.query as z.infer<typeof listEventsQuerySchema>;

        const result = await useCase.execute({
          tenantId,
          page: query.page,
          perPage: query.perPage,
          status: query.status as never,
          eventType: query.eventType,
          search: query.search,
        });

        return reply.status(200).send(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro interno';
        return reply.status(500).send({ message });
      }
    },
  });
}
