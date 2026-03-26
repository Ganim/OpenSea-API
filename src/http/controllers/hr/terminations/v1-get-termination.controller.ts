import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { terminationResponseSchema } from '@/http/schemas';
import { terminationToDTO } from '@/mappers/hr/termination';
import { makeGetTerminationUseCase } from '@/use-cases/hr/terminations/factories/make-get-termination-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetTerminationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/terminations/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.EMPLOYEES.ADMIN,
        resource: 'terminations',
      }),
    ],
    schema: {
      tags: ['HR - Terminations'],
      summary: 'Get termination by ID',
      description: 'Returns a single termination record with all details',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          termination: terminationResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeGetTerminationUseCase();
        const { termination } = await useCase.execute({
          tenantId,
          terminationId: id,
        });

        return reply
          .status(200)
          .send({ termination: terminationToDTO(termination) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
