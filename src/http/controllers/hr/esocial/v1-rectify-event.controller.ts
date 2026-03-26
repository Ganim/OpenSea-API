import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeRectifyEventUseCase } from '@/use-cases/esocial/events/factories/make-rectify-event-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { eventIdParamSchema } from './esocial-api-schemas';

const rectifyEventBodySchema = z.object({
  xmlContent: z.string().min(1, 'XML de retificação é obrigatório'),
});

export async function v1RectifyEventController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/esocial/events/:id/rectify',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - eSocial'],
      summary: 'Create event rectification',
      description:
        'Creates a new rectification event (indRetif=2) linked to the original ACCEPTED event. The new event starts in DRAFT status.',
      params: eventIdParamSchema,
      body: rectifyEventBodySchema,
      response: {
        201: z.object({
          event: z.object({
            id: z.string(),
            eventType: z.string(),
            status: z.string(),
            isRectification: z.boolean(),
            createdAt: z.string(),
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
      const { xmlContent } = request.body;

      const useCase = makeRectifyEventUseCase();
      const { event } = await useCase.execute({
        tenantId,
        eventId: id,
        xmlContent,
      });

      return reply.status(201).send({
        event: {
          id: event.id.toString(),
          eventType: event.eventType,
          status: event.status,
          isRectification: event.isRectification,
          createdAt: event.createdAt.toISOString(),
        },
      });
    },
  });
}
