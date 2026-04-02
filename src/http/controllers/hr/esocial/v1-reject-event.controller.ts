import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeRejectEventUseCase } from '@/use-cases/esocial/events/factories/make-reject-event-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { eventIdParamSchema } from './esocial-api-schemas';

const rejectEventBodySchema = z.object({
  reason: z.string().min(1, 'Motivo da rejeição é obrigatório'),
});

export async function v1RejectEventController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/esocial/events/:id/reject',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - eSocial'],
      summary: 'Reject event back to draft',
      description:
        'Rejects an event (from REVIEWED or VALIDATED) back to DRAFT with a reason',
      params: eventIdParamSchema,
      body: rejectEventBodySchema,
      response: {
        200: z.object({
          event: z.object({
            id: z.string(),
            status: z.string(),
          }),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const { reason } = request.body;

      const useCase = makeRejectEventUseCase();
      const { event } = await useCase.execute({
        tenantId,
        eventId: id,
        reason,
      });

      return reply.status(200).send({
        event: {
          id: event.id.toString(),
          status: event.status,
        },
      });
    },
  });
}
