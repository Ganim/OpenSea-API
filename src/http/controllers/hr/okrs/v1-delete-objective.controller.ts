import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { cuidSchema } from '@/http/schemas/common.schema';
import { makeDeleteObjectiveUseCase } from '@/use-cases/hr/okrs/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1DeleteObjectiveController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/okrs/objectives/:objectiveId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.OKRS.REMOVE,
        resource: 'okrs',
      }),
    ],
    schema: {
      tags: ['HR - OKRs'],
      summary: 'Delete an objective',
      description: 'Deletes an OKR objective (only draft/cancelled)',
      params: z.object({ objectiveId: cuidSchema }),
      response: {
        204: z.null(),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { objectiveId } = request.params;

      const useCase = makeDeleteObjectiveUseCase();
      await useCase.execute({ tenantId, objectiveId });

      return reply.status(204).send(null);
    },
  });
}
