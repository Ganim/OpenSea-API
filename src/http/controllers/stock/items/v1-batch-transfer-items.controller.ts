import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  batchTransferItemsSchema,
  batchTransferResponseSchema,
} from '@/http/schemas';
import { makeBatchTransferItemsUseCase } from '@/use-cases/stock/items/factories/make-batch-transfer-items-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function batchTransferItemsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/items/batch-transfer',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.ITEMS.TRANSFER,
        resource: 'items',
      }),
    ],
    schema: {
      tags: ['Stock - Items'],
      summary: 'Batch transfer items to a bin',
      description:
        'Transfere multiplos itens para um bin de destino em uma unica operacao. Ideal para realocacao de itens apos reconfiguracao de zona. Bins bloqueados de origem sao automaticamente removidos quando ficam vazios.',
      body: batchTransferItemsSchema,
      response: {
        200: batchTransferResponseSchema,
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
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { itemIds, destinationBinId, notes } = request.body;

      try {
        const batchTransferUseCase = makeBatchTransferItemsUseCase();
        const result = await batchTransferUseCase.execute({
          tenantId,
          itemIds,
          destinationBinId,
          userId,
          notes,
        });

        return reply.status(200).send(result);
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
