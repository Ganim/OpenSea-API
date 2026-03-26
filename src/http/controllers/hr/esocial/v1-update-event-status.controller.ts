import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { UpdateEventStatusUseCase } from '@/use-cases/hr/esocial/update-event-status';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import {
  eventIdParamSchema,
  updateEventStatusBodySchema,
} from './esocial-api-schemas';

export async function v1UpdateEventStatusController(app: FastifyInstance) {
  const useCase = new UpdateEventStatusUseCase();

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/esocial/events/:id/status',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - eSocial'],
      summary: 'Update eSocial event status',
      description: 'Review, approve, reject, or rectify an eSocial event',
      params: eventIdParamSchema,
      body: updateEventStatusBodySchema,
      response: {
        200: z.any(),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const tenantId = request.user.tenantId!;
        const userId = request.user.sub;
        const { id } = request.params as z.infer<typeof eventIdParamSchema>;
        const body = request.body as z.infer<
          typeof updateEventStatusBodySchema
        >;

        const result = await useCase.execute({
          tenantId,
          eventId: id,
          action: body.action,
          userId,
          rejectionReason: body.rejectionReason,
        });

        return reply.status(200).send(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro interno';
        if (message.includes('não encontrado')) {
          return reply.status(404).send({ message });
        }
        return reply.status(400).send({ message });
      }
    },
  });
}
