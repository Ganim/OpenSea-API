import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteEventUseCase } from '@/use-cases/esocial/events/factories/make-delete-event-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { eventIdParamSchema } from './esocial-api-schemas';

export async function v1DeleteEventController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/esocial/events/:id',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - eSocial'],
      summary: 'Delete draft eSocial event',
      description: 'Deletes an eSocial event. Only events in DRAFT status can be deleted.',
      params: eventIdParamSchema,
      response: {
        204: z.null().describe('Event deleted successfully'),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      const useCase = makeDeleteEventUseCase();
      await useCase.execute({
        tenantId,
        eventId: id,
      });

      return reply.status(204).send();
    },
  });
}
