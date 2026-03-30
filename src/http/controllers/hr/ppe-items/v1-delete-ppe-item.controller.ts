import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas';
import { makeDeletePPEItemUseCase } from '@/use-cases/hr/ppe-items/factories/make-delete-ppe-item-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1DeletePPEItemController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/ppe-items/:ppeItemId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.PPE.REMOVE,
        resource: 'ppe-items',
      }),
    ],
    schema: {
      tags: ['HR - PPE (EPI)'],
      summary: 'Delete PPE item',
      description: 'Soft-deletes a PPE item',
      params: z.object({
        ppeItemId: idSchema,
      }),
      response: {
        204: z.null(),
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
        const useCase = makeDeletePPEItemUseCase();
        await useCase.execute({ tenantId, ppeItemId });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
