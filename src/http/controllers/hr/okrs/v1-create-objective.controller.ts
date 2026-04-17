import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createObjectiveSchema,
  objectiveResponseSchema,
} from '@/http/schemas/hr/okrs';
import { objectiveToDTO } from '@/mappers/hr/objective';
import { makeCreateObjectiveUseCase } from '@/use-cases/hr/okrs/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function v1CreateObjectiveController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/okrs/objectives',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.OKRS.REGISTER,
        resource: 'okrs',
      }),
    ],
    schema: {
      tags: ['HR - OKRs'],
      summary: 'Create an objective',
      description: 'Creates a new OKR objective',
      body: createObjectiveSchema,
      response: {
        201: objectiveResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeCreateObjectiveUseCase();
      const { objective } = await useCase.execute({
        tenantId,
        ...request.body,
      });

      return reply.status(201).send(objectiveToDTO(objective));
    },
  });
}
