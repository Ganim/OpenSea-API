import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetHrConfigUseCase } from '@/use-cases/hr/hr-config/factories/make-get-hr-config-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { hrConfigResponseSchema, hrConfigToDTO } from './shared';

export async function v1GetHrConfigController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/config',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.EMPLOYEES.ADMIN,
        resource: 'employees',
      }),
    ],
    schema: {
      tags: ['HR - Configuration'],
      summary: 'Get HR tenant configuration',
      description:
        'Gets the HR configuration for the tenant. Creates default if none exists.',
      response: {
        200: z.object({
          hrConfig: hrConfigResponseSchema,
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeGetHrConfigUseCase();
      const { hrConfig } = await useCase.execute({ tenantId });

      return reply.status(200).send({
        hrConfig: hrConfigToDTO(hrConfig),
      });
    },
  });
}
