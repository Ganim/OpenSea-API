import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { customerResponseSchema } from '@/http/schemas/sales.schema';
import { makeListCustomersUseCase } from '@/use-cases/sales/customers/factories/make-list-customers-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listCustomersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/customers',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Sales - Customers'],
      summary: 'List customers',
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        perPage: z.coerce.number().int().positive().max(100).default(20),
        type: z.enum(['INDIVIDUAL', 'BUSINESS']).optional(),
        isActive: z.coerce.boolean().optional(),
      }),
      response: {
        200: z.object({
          customers: z.array(customerResponseSchema),
          total: z.number(),
          page: z.number(),
          perPage: z.number(),
          totalPages: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const query = request.query;
      const tenantId = request.user.tenantId!;

      const useCase = makeListCustomersUseCase();
      const result = await useCase.execute({ tenantId, ...query });

      return reply.status(200).send(result);
    },
  });
}
