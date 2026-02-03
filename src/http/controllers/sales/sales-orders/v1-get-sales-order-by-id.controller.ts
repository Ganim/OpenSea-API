import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { salesOrderResponseSchema } from '@/http/schemas/sales.schema';
import { makeGetSalesOrderByIdUseCase } from '@/use-cases/sales/sales-orders/factories/make-get-sales-order-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1GetSalesOrderByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales-orders/:id',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Sales - Orders'],
      summary: 'Get sales order by ID',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ salesOrder: salesOrderResponseSchema }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const tenantId = request.user.tenantId!;
        const useCase = makeGetSalesOrderByIdUseCase();
        const { salesOrder } = await useCase.execute({ tenantId, id });
        return reply.status(200).send({ salesOrder });
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
