import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateObjectiveSchema,
  objectiveResponseSchema,
} from '@/http/schemas/hr/okrs';
import { cuidSchema } from '@/http/schemas/common.schema';
import { objectiveToDTO } from '@/mappers/hr/objective';
import { makeUpdateObjectiveUseCase } from '@/use-cases/hr/okrs/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateObjectiveController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/okrs/objectives/:objectiveId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.OKRS.MODIFY,
        resource: 'okrs',
      }),
    ],
    schema: {
      tags: ['HR - OKRs'],
      summary: 'Update an objective',
      description: 'Updates an OKR objective',
      params: z.object({ objectiveId: cuidSchema }),
      body: updateObjectiveSchema,
      response: {
        200: objectiveResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { objectiveId } = request.params;

      const useCase = makeUpdateObjectiveUseCase();
      const { objective } = await useCase.execute({
        tenantId,
        objectiveId,
        ...request.body,
      });

      return reply.status(200).send(objectiveToDTO(objective));
    },
  });
}
