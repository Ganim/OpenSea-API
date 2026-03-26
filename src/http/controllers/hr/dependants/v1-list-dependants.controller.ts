import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  dependantResponseSchema,
  listDependantsQuerySchema,
} from '@/http/schemas';
import { idSchema } from '@/http/schemas';
import { dependantToDTO } from '@/mappers/hr/dependant';
import { makeListDependantsUseCase } from '@/use-cases/hr/dependants/factories/make-list-dependants-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListDependantsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/employees/:employeeId/dependants',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Dependants'],
      summary: 'List dependants',
      description: 'Lists all dependants for an employee',
      params: z.object({
        employeeId: idSchema,
      }),
      querystring: listDependantsQuerySchema,
      response: {
        200: z.object({
          dependants: z.array(dependantResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { employeeId } = request.params;
      const filters = request.query;

      const useCase = makeListDependantsUseCase();
      const { dependants } = await useCase.execute({
        tenantId,
        employeeId,
        ...filters,
      });

      return reply.status(200).send({
        dependants: dependants.map(dependantToDTO),
      });
    },
  });
}
