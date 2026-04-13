import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { textileConfigResponseSchema } from '@/http/schemas/production/textile.schema';
import { makeGetTextileConfigUseCase } from '@/use-cases/production/textile/factories/make-get-textile-config-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getTextileConfigController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/textile/config',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ENGINEERING.ACCESS,
        resource: 'textile-config',
      }),
    ],
    schema: {
      tags: ['Production - Textile'],
      summary: 'Get textile production configuration',
      response: {
        200: z.object({
          config: textileConfigResponseSchema,
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeGetTextileConfigUseCase();
      const { config } = await useCase.execute({ tenantId });

      return reply.status(200).send({ config });
    },
  });
}
