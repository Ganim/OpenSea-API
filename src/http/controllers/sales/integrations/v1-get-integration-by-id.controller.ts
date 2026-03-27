import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { integrationResponseSchema } from '@/http/schemas/sales/integrations';
import { makeGetIntegrationByIdUseCase } from '@/use-cases/sales/integrations/factories/make-get-integration-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getIntegrationByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/integrations/:integrationId',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Sales - Integrations'],
      summary: 'Get integration by ID',
      params: z.object({
        integrationId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          integration: integrationResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { integrationId } = request.params;

      try {
        const useCase = makeGetIntegrationByIdUseCase();
        const { integration } = await useCase.execute({ integrationId });

        return reply.status(200).send({ integration });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
