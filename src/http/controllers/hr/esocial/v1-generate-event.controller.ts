import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGenerateEventUseCase } from '@/use-cases/esocial/events/factories/make-generate-event-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const generateEventBodySchema = z.object({
  eventType: z.enum([
    // Table events
    'S-1000',
    'S-1005',
    'S-1010',
    'S-1020',
    'S-1070',
    // Periodic events
    'S-1200',
    'S-1210',
    'S-1298',
    'S-1299',
    // Non-periodic events
    'S-2190',
    'S-2200',
    'S-2205',
    'S-2206',
    'S-2210',
    'S-2220',
    'S-2230',
    'S-2240',
    'S-2298',
    'S-2299',
    'S-2300',
    'S-2399',
    // Exclusion
    'S-3000',
  ]),
  referenceType: z.enum([
    'EMPLOYEE',
    'PAYROLL',
    'ABSENCE',
    'TERMINATION',
    'MEDICAL_EXAM',
    'TENANT_CONFIG',
    'RUBRICA',
    'ESOCIAL_EVENT',
  ]),
  referenceId: z.string().uuid(),
  additionalData: z.record(z.unknown()).optional(),
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
        'Generates an eSocial XML event from a source HR entity. Supports all 22 event types: table events (S-1000 to S-1070), periodic events (S-1200 to S-1299), non-periodic events (S-2190 to S-2399), and exclusion (S-3000). The event is stored in DRAFT status. Some event types require additionalData with extra context.',
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
      const { eventType, referenceType, referenceId, additionalData } =
        request.body;

      const useCase = makeGenerateEventUseCase();
      const { event } = await useCase.execute({
        tenantId,
        eventType,
        referenceType,
        referenceId,
        additionalData,
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
