import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetTenantAuthConfigUseCase } from '@/use-cases/core/auth/factories/make-get-tenant-auth-config-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const authMethodEnum = z.enum([
  'EMAIL',
  'CPF',
  'ENROLLMENT',
  'GOOGLE',
  'MICROSOFT',
  'APPLE',
  'GITHUB',
]);

const configResponseSchema = z.object({
  config: z.object({
    id: z.string(),
    tenantId: z.string(),
    allowedMethods: z.array(authMethodEnum),
    magicLinkEnabled: z.boolean(),
    magicLinkExpiresIn: z.number(),
    defaultMethod: authMethodEnum.nullable(),
  }),
});

export async function getTenantAuthConfigController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/tenant-auth-config',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ADMIN.SETTINGS.ACCESS,
        resource: 'settings',
      }),
    ],
    schema: {
      tags: ['Auth - Tenant Config'],
      summary: 'Get tenant authentication configuration',
      security: [{ bearerAuth: [] }],
      response: {
        200: configResponseSchema,
      },
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeGetTenantAuthConfigUseCase();
      const { config } = await useCase.execute({
        tenantId: new UniqueEntityID(tenantId),
      });

      return reply.status(200).send({ config });
    },
  });
}
