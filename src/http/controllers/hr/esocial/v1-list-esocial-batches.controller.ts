import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { ListEsocialBatchesUseCase } from '@/use-cases/hr/esocial/list-esocial-batches';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { listBatchesQuerySchema } from './esocial-api-schemas';

export async function v1ListEsocialBatchesController(app: FastifyInstance) {
  const useCase = new ListEsocialBatchesUseCase();

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/esocial/batches',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - eSocial'],
      summary: 'List eSocial batches',
      description: 'Lists transmission batches with filtering and pagination',
      querystring: listBatchesQuerySchema,
      response: {
        200: z.any(),
        500: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const tenantId = request.user.tenantId!;
        const query = request.query as z.infer<typeof listBatchesQuerySchema>;

        const result = await useCase.execute({
          tenantId,
          page: query.page,
          perPage: query.perPage,
          status: query.status,
        });

        return reply.status(200).send(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro interno';
        return reply.status(500).send({ message });
      }
    },
  });
}
