import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listPPEItemsQuerySchema,
  ppeItemResponseSchema,
} from '@/http/schemas/hr/safety';
import { ppeItemToDTO } from '@/mappers/hr/ppe-item';
import { makeListPPEItemsUseCase } from '@/use-cases/hr/ppe-items/factories/make-list-ppe-items-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListPPEItemsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/ppe-items',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - PPE (EPI)'],
      summary: 'List PPE items',
      description: 'Lists all PPE items with optional filters (category, active status, low stock)',
      querystring: listPPEItemsQuerySchema,
      response: {
        200: z.object({
          ppeItems: z.array(ppeItemResponseSchema),
          total: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const filters = request.query;

      const useCase = makeListPPEItemsUseCase();
      const { ppeItems, total } = await useCase.execute({
        tenantId,
        ...filters,
      });

      return reply.status(200).send({
        ppeItems: ppeItems.map(ppeItemToDTO),
        total,
      });
    },
  });
}
