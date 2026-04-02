import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createDependantSchema, dependantResponseSchema } from '@/http/schemas';
import { idSchema } from '@/http/schemas';
import { dependantToDTO } from '@/mappers/hr/dependant';
import { makeCreateDependantUseCase } from '@/use-cases/hr/dependants/factories/make-create-dependant-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateDependantController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/employees/:employeeId/dependants',
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
      summary: 'Create dependant',
      description: 'Creates a new dependant for an employee',
      params: z.object({
        employeeId: idSchema,
      }),
      body: createDependantSchema,
      response: {
        201: z.object({
          dependant: dependantResponseSchema,
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
      const { employeeId } = request.params;
      const data = request.body;

      try {
        const useCase = makeCreateDependantUseCase();
        const { dependant } = await useCase.execute({
          tenantId,
          employeeId,
          ...data,
        });

        return reply.status(201).send({ dependant: dependantToDTO(dependant) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
