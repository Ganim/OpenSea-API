import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  esocialConfigResponseSchema,
  updateEsocialConfigSchema,
} from '@/http/schemas/esocial';
import { makeUpdateEsocialConfigUseCase } from '@/use-cases/esocial/config/factories/make-update-esocial-config';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateEsocialConfigController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/esocial/config',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ESOCIAL.CONFIG.ADMIN,
        resource: 'esocial-config',
      }),
    ],
    schema: {
      tags: ['eSocial - Config'],
      summary: 'Update eSocial configuration',
      description: 'Update the eSocial configuration for the current tenant.',
      body: updateEsocialConfigSchema,
      response: {
        200: z.object({
          config: esocialConfigResponseSchema,
        }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const useCase = makeUpdateEsocialConfigUseCase();
        const { config } = await useCase.execute({
          tenantId,
          ...data,
        });

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
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
