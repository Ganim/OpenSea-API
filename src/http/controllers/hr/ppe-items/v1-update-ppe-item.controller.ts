import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updatePPEItemSchema,
  ppeItemResponseSchema,
} from '@/http/schemas/hr/safety';
import { idSchema } from '@/http/schemas';
import { ppeItemToDTO } from '@/mappers/hr/ppe-item';
import { makeUpdatePPEItemUseCase } from '@/use-cases/hr/ppe-items/factories/make-update-ppe-item-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdatePPEItemController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/ppe-items/:ppeItemId',
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
      summary: 'Update PPE item',
      description: 'Updates an existing PPE item',
      params: z.object({
        ppeItemId: idSchema,
      }),
      body: updatePPEItemSchema,
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
      const data = request.body;

      try {
        const useCase = makeUpdatePPEItemUseCase();
        const { ppeItem } = await useCase.execute({
          tenantId,
          ppeItemId,
          ...data,
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
