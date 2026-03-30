import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { ppeItemResponseSchema } from '@/http/schemas/hr/safety';
import { idSchema } from '@/http/schemas';
import { ppeItemToDTO } from '@/mappers/hr/ppe-item';
import { makeGetPPEItemUseCase } from '@/use-cases/hr/ppe-items/factories/make-get-ppe-item-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetPPEItemController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/ppe-items/:ppeItemId',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - PPE (EPI)'],
      summary: 'Get PPE item',
      description: 'Gets a PPE item by ID',
      params: z.object({
        ppeItemId: idSchema,
      }),
      response: {
        200: z.object({
          ppeItem: ppeItemResponseSchema,
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

      try {
        const useCase = makeGetPPEItemUseCase();
        const { ppeItem } = await useCase.execute({
          tenantId,
          ppeItemId,
        });

        return reply.status(200).send({ ppeItem: ppeItemToDTO(ppeItem) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
