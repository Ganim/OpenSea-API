import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  queueReceiptBodySchema,
  queueReceiptParamsSchema,
  queueReceiptResponseSchema,
} from '@/http/schemas/sales/printing/print-job.schema';
import { makeQueueReceiptUseCase } from '@/use-cases/sales/printing/factories/make-queue-receipt-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1QueueReceiptController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/orders/:orderId/print',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PRINTING.PRINT,
        resource: 'sales-printing',
      }),
    ],
    schema: {
      tags: ['Sales - Printing'],
      summary: 'Queue receipt for thermal printer',
      params: queueReceiptParamsSchema,
      body: queueReceiptBodySchema,
      response: {
        202: queueReceiptResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeQueueReceiptUseCase();

        const result = await useCase.execute({
          tenantId: request.user.tenantId!,
          orderId: request.params.orderId,
          printerId: request.body.printerId,
        });

        return reply.status(202).send(result);
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
