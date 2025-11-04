import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import {
  createCustomerSchema,
  customerResponseSchema,
} from '@/http/schemas/sales.schema';
import { makeCreateCustomerUseCase } from '@/use-cases/sales/customers/factories/make-create-customer-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createCustomerController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/customers',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['Customers'],
      summary: 'Create a new customer',
      body: createCustomerSchema,
      response: {
        201: z.object({
          customer: customerResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      try {
        const useCase = makeCreateCustomerUseCase();
        const { customer } = await useCase.execute(request.body);

        return reply.status(201).send({ customer });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
