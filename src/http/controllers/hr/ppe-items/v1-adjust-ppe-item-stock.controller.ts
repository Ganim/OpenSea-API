import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  adjustPPEItemStockSchema,
  ppeItemResponseSchema,
} from '@/http/schemas/hr/safety';
import { cuidSchema } from '@/http/schemas/common.schema';
import { ppeItemToDTO } from '@/mappers/hr/ppe-item';
import { makeAdjustPPEItemStockUseCase } from '@/use-cases/hr/ppe-items/factories/make-adjust-ppe-item-stock-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1AdjustPPEItemStockController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/ppe-items/:ppeItemId/stock',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.PPE.MODIFY,
        resource: 'ppe-items',
      }),
    ],
    schema: {
      tags: ['HR - PPE (EPI)'],
      summary: 'Adjust PPE item stock',
      description:
        'Adjusts the current stock of a PPE item (positive to add, negative to subtract)',
      params: z.object({
        ppeItemId: cuidSchema,
      }),
      body: adjustPPEItemStockSchema,
      response: {
        200: z.object({
          ppeItem: ppeItemResponseSchema,
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
      const tenantId = request.user.tenantId!;
      const { ppeItemId } = request.params;
      const { adjustment } = request.body;

      try {
        const useCase = makeAdjustPPEItemStockUseCase();
        const { ppeItem } = await useCase.execute({
          tenantId,
          ppeItemId,
          adjustment,
        });

        return reply.status(200).send({ ppeItem: ppeItemToDTO(ppeItem) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
