import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { CheckBatchStatusUseCase } from '@/use-cases/hr/esocial/check-batch-status';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { batchIdParamSchema } from './esocial-api-schemas';

export async function v1CheckBatchStatusController(app: FastifyInstance) {
  const useCase = new CheckBatchStatusUseCase();

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/esocial/batches/:id/check',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - eSocial'],
      summary: 'Check batch status',
      description:
        'Queries eSocial webservice for the status of a transmitted batch',
      params: batchIdParamSchema,
      response: {
        200: z.any(),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const tenantId = request.user.tenantId!;
        const { id } = request.params as z.infer<typeof batchIdParamSchema>;

        const result = await useCase.execute({ tenantId, batchId: id });
        return reply.status(200).send(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro interno';
        if (message.includes('não encontrado')) {
          return reply.status(404).send({ message });
        }
        if (
          message.includes('protocolo') ||
          message.includes('Certificado') ||
          message.includes('Configuração')
        ) {
          return reply.status(400).send({ message });
        }
        return reply.status(500).send({ message });
      }
    },
  });
}
