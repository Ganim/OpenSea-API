import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found-error';
import { makeGetPortalDataUseCase } from '@/use-cases/sales/analytics/customer-portal/factories/make-get-portal-data-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getPortalDataController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/analytics/customer-portal/:token',
    // Public endpoint - no auth required
    schema: {
      tags: ['Sales - Customer Portal'],
      summary: 'Get customer portal data (public, token-based)',
      params: z.object({ token: z.string() }),
      response: {
        200: z.object({ access: z.any() }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const { token } = request.params;

      try {
        const useCase = makeGetPortalDataUseCase();
        const result = await useCase.execute({ accessToken: token });
        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: 'Portal access not found.' });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
