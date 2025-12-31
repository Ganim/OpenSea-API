import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
    customerResponseSchema,
    updateCustomerSchema,
} from '@/http/schemas/sales.schema';
import { makeUpdateCustomerUseCase } from '@/use-cases/sales/customers/factories/make-update-customer-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateCustomerController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/customers/:id',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CUSTOMERS.UPDATE,
        resource: 'customers',
      }),
    ],
    schema: {
      tags: ['Sales - Customers'],
      summary: 'Update a customer',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: updateCustomerSchema.extend({
        type: z.enum(['INDIVIDUAL', 'BUSINESS']).optional(),
        isActive: z.boolean().optional(),
      }),
      response: {
        200: z.object({
          customer: customerResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body;

      try {
        const useCase = makeUpdateCustomerUseCase();
        const { customer } = await useCase.execute({ id, ...body });

        return reply.status(200).send({ customer });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
