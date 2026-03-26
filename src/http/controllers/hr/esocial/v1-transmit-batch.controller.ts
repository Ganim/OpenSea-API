import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { TransmitBatchUseCase } from '@/use-cases/hr/esocial/transmit-batch';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1TransmitBatchController(app: FastifyInstance) {
  const useCase = new TransmitBatchUseCase();

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/esocial/batches/transmit',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - eSocial'],
      summary: 'Transmit approved events to eSocial',
      description:
        'Collects all approved events, signs them, and transmits to eSocial webservice',
      response: {
        200: z.any(),
        400: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const tenantId = request.user.tenantId!;
        const userId = request.user.sub;

        const result = await useCase.execute({ tenantId, userId });
        return reply.status(200).send(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro interno';
        if (
          message.includes('não encontrad') ||
          message.includes('expirado') ||
          message.includes('Configure')
        ) {
          return reply.status(400).send({ message });
        }
        return reply.status(500).send({ message });
      }
    },
  });
}
