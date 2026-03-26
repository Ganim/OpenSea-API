import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateDependantSchema,
  dependantResponseSchema,
  dependantParamsSchema,
} from '@/http/schemas';
import { dependantToDTO } from '@/mappers/hr/dependant';
import { makeUpdateDependantUseCase } from '@/use-cases/hr/dependants/factories/make-update-dependant-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateDependantController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/employees/:employeeId/dependants/:dependantId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.EMPLOYEES.ADMIN,
        resource: 'dependants',
      }),
    ],
    schema: {
      tags: ['HR - Dependants'],
      summary: 'Update dependant',
      description: 'Updates an existing dependant',
      params: dependantParamsSchema,
      body: updateDependantSchema,
      response: {
        200: z.object({
          dependant: dependantResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { dependantId } = request.params;
      const data = request.body;

      try {
        const useCase = makeUpdateDependantUseCase();
        const { dependant } = await useCase.execute({
          tenantId,
          dependantId,
          ...data,
        });

        return reply.status(200).send({ dependant: dependantToDTO(dependant) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
