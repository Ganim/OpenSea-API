import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { customerResponseSchema } from '@/http/schemas/sales.schema';
import { makeGetCustomerByIdUseCase } from '@/use-cases/sales/customers/factories/make-get-customer-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getCustomerByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/customers/:id',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Customers'],
      summary: 'Get customer by ID',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          customer: customerResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      try {
        const useCase = makeGetCustomerByIdUseCase();
        const { customer } = await useCase.execute({ id });

        return reply.status(200).send({ customer });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
