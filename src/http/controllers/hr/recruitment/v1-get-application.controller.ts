import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { applicationResponseSchema } from '@/http/schemas/hr/recruitment';
import { cuidSchema } from '@/http/schemas/common.schema';
import { applicationToDTO } from '@/mappers/hr/application';
import { makeGetApplicationUseCase } from '@/use-cases/hr/applications/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetApplicationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/recruitment/applications/:applicationId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.RECRUITMENT.ACCESS,
        resource: 'recruitment',
      }),
    ],
    schema: {
      tags: ['HR - Recruitment'],
      summary: 'Get application',
      description: 'Gets a candidate application by ID',
      params: z.object({ applicationId: cuidSchema }),
      response: {
        200: z.object({ application: applicationResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { applicationId } = request.params;

      try {
        const useCase = makeGetApplicationUseCase();
        const { application } = await useCase.execute({
          tenantId,
          applicationId,
        });

        return reply
          .status(200)
          .send({ application: applicationToDTO(application) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
