import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { dependantResponseSchema, dependantParamsSchema } from '@/http/schemas';
import { dependantToDTO } from '@/mappers/hr/dependant';
import { makeGetDependantUseCase } from '@/use-cases/hr/dependants/factories/make-get-dependant-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetDependantController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/employees/:employeeId/dependants/:dependantId',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Dependants'],
      summary: 'Get dependant',
      description: 'Gets a dependant by ID',
      params: dependantParamsSchema,
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

      try {
        const useCase = makeGetDependantUseCase();
        const { dependant } = await useCase.execute({
          tenantId,
          dependantId,
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
