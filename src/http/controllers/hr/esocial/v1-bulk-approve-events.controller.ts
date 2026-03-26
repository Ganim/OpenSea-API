import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { BulkApproveEventsUseCase } from '@/use-cases/hr/esocial/bulk-approve-events';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { bulkApproveBodySchema } from './esocial-api-schemas';

export async function v1BulkApproveEventsController(app: FastifyInstance) {
  const useCase = new BulkApproveEventsUseCase();

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/esocial/events/bulk-approve',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - eSocial'],
      summary: 'Bulk approve eSocial events',
      description: 'Approve multiple eSocial events at once',
      body: bulkApproveBodySchema,
      response: {
        200: z.any(),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const tenantId = request.user.tenantId!;
        const userId = request.user.sub;
        const body = request.body as z.infer<typeof bulkApproveBodySchema>;

        const result = await useCase.execute({
          tenantId,
          eventIds: body.eventIds,
          userId,
        });

        return reply.status(200).send(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro interno';
        return reply.status(400).send({ message });
      }
    },
  });
}
