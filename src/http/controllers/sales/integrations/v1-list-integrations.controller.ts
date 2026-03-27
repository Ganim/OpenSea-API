import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { integrationResponseSchema } from '@/http/schemas/sales/integrations';
import { makeListIntegrationsUseCase } from '@/use-cases/sales/integrations/factories/make-list-integrations-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listIntegrationsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/integrations',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Sales - Integrations'],
      summary: 'List all available integrations',
      response: {
        200: z.object({
          integrations: z.array(integrationResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (_request, reply) => {
      const useCase = makeListIntegrationsUseCase();
      const { integrations } = await useCase.execute();

      return reply.status(200).send({ integrations });
    },
  });
}
