import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGenerateEventUseCase } from '@/use-cases/esocial/events/factories/make-generate-event-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const generateEventBodySchema = z.object({
  eventType: z.enum([
    'S-2190',
    'S-2200',
    'S-2206',
    'S-2230',
    'S-2299',
  ]),
  referenceType: z.enum([
    'EMPLOYEE',
    'ABSENCE',
    'TERMINATION',
  ]),
  referenceId: z.string().uuid(),
});

export async function v1GenerateEventController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/esocial/events/generate',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - eSocial'],
      summary: 'Generate eSocial event from HR entity',
      description:
        'Generates an eSocial XML event from a source HR entity (Employee, Absence, or Termination). The event is stored in DRAFT status.',
      body: generateEventBodySchema,
      response: {
        201: z.object({
          event: z.object({
            id: z.string(),
            eventType: z.string(),
            status: z.string(),
            xmlContent: z.string(),
            xmlHash: z.string().optional(),
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
      const { eventType, referenceType, referenceId } = request.body;

      const useCase = makeGenerateEventUseCase();
      const { event } = await useCase.execute({
        tenantId,
        eventType,
        referenceType,
        referenceId,
      });

      return reply.status(201).send({
        event: {
          id: event.id.toString(),
          eventType: event.eventType,
          status: event.status,
          xmlContent: event.xmlContent,
          xmlHash: event.xmlHash,
          createdAt: event.createdAt.toISOString(),
        },
      });
    },
  });
}
