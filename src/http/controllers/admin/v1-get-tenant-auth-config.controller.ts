import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
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

export async function getTenantAuthConfigAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/tenants/:id/auth-config',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Tenants'],
      summary: 'Get tenant authentication configuration (super admin)',
      description:
        'Returns the authentication configuration for a specific tenant. Requires super admin privileges.',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: configResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;

      const useCase = makeGetTenantAuthConfigUseCase();
      const { config } = await useCase.execute({
        tenantId: new UniqueEntityID(id),
      });

      return reply.status(200).send({ config });
    },
  });
}
