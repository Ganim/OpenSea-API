import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeUpdateTenantAuthConfigUseCase } from '@/use-cases/core/auth/factories/make-update-tenant-auth-config-use-case';

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

const bodySchema = z.object({
  allowedMethods: z.array(authMethodEnum),
  magicLinkEnabled: z.boolean(),
  magicLinkExpiresIn: z.number().int().min(5).max(60),
  defaultMethod: authMethodEnum.nullable().optional(),
});

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

export async function updateTenantAuthConfigController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/tenant-auth-config',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ADMIN.SETTINGS.ADMIN,
        resource: 'settings',
      }),
    ],
    schema: {
      tags: ['Auth - Tenant Config'],
      summary: 'Update tenant authentication configuration',
      security: [{ bearerAuth: [] }],
      body: bodySchema,
      response: {
        200: configResponseSchema,
        400: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const {
        allowedMethods,
        magicLinkEnabled,
        magicLinkExpiresIn,
        defaultMethod,
      } = request.body;

      const useCase = makeUpdateTenantAuthConfigUseCase();
      const { config } = await useCase.execute({
        tenantId: new UniqueEntityID(tenantId),
        allowedMethods,
        magicLinkEnabled,
        magicLinkExpiresIn,
        defaultMethod: defaultMethod ?? undefined,
      });

      return reply.status(200).send({ config });
    },
  });
}
