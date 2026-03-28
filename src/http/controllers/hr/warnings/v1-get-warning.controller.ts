import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema, warningResponseSchema } from '@/http/schemas';
import { employeeWarningToDTO } from '@/mappers/hr/employee-warning';
import { makeGetWarningUseCase } from '@/use-cases/hr/warnings/factories/make-get-warning-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetWarningController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/warnings/:warningId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.WARNINGS.ACCESS,
        resource: 'warnings',
      }),
    ],
    schema: {
      tags: ['HR - Warnings'],
      summary: 'Get employee warning',
      description: 'Retrieves a specific employee warning by ID',
      params: z.object({
        warningId: idSchema,
      }),
      response: {
        200: z.object({
          warning: warningResponseSchema,
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { warningId } = request.params;

      try {
        const getWarningUseCase = makeGetWarningUseCase();
        const { warning } = await getWarningUseCase.execute({
          tenantId,
          warningId,
        });

        return reply
          .status(200)
          .send({ warning: employeeWarningToDTO(warning) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
