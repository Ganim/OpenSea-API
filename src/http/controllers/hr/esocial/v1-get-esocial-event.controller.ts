import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { GetEsocialEventUseCase } from '@/use-cases/hr/esocial/get-esocial-event';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { eventIdParamSchema } from './esocial-api-schemas';

export async function v1GetEsocialEventController(app: FastifyInstance) {
  const useCase = new GetEsocialEventUseCase();

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/esocial/events/:id',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - eSocial'],
      summary: 'Get eSocial event details',
      description:
        'Returns detailed information about a specific eSocial event',
      params: eventIdParamSchema,
      response: {
        200: z.any(),
        404: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const tenantId = request.user.tenantId!;
        const { id } = request.params as z.infer<typeof eventIdParamSchema>;

        const result = await useCase.execute({ tenantId, eventId: id });
        return reply.status(200).send(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro interno';
        if (message.includes('não encontrado')) {
          return reply.status(404).send({ message });
        }
        return reply.status(500).send({ message });
      }
    },
  });
}
