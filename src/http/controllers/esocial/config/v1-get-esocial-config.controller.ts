import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { esocialConfigResponseSchema } from '@/http/schemas/esocial';
import { makeGetEsocialConfigUseCase } from '@/use-cases/esocial/config/factories/make-get-esocial-config';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetEsocialConfigController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/esocial/config',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ESOCIAL.CONFIG.ACCESS,
        resource: 'esocial-config',
      }),
    ],
    schema: {
      tags: ['eSocial - Config'],
      summary: 'Get eSocial configuration',
      description:
        'Returns the eSocial configuration for the current tenant. Auto-creates a default config if none exists.',
      response: {
        200: z.object({
          config: esocialConfigResponseSchema,
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeGetEsocialConfigUseCase();
      const { config } = await useCase.execute({ tenantId });

      return reply.status(200).send({
        config: {
          id: config.id.toString(),
          tenantId: config.tenantId.toString(),
          environment: config.environment,
          version: config.version,
          tpInsc: config.tpInsc,
          nrInsc: config.nrInsc ?? null,
          inpiNumber: config.inpiNumber ?? null,
          autoGenerateOnAdmission: config.autoGenerateOnAdmission,
          autoGenerateOnTermination: config.autoGenerateOnTermination,
          autoGenerateOnLeave: config.autoGenerateOnLeave,
          autoGenerateOnPayroll: config.autoGenerateOnPayroll,
          requireApproval: config.requireApproval,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt,
        },
      });
    },
  });
}
