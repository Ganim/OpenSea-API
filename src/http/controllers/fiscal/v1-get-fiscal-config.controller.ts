import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { fiscalConfigResponseSchema } from '@/http/schemas/fiscal';
import { makeGetFiscalConfigUseCase } from '@/use-cases/fiscal/config/factories/make-get-fiscal-config-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getFiscalConfigController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/fiscal/config',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SYSTEM.FISCAL.ACCESS,
        resource: 'fiscal',
      }),
    ],
    schema: {
      tags: ['Fiscal'],
      summary: 'Get fiscal configuration for current tenant',
      response: {
        200: z.object({ config: fiscalConfigResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeGetFiscalConfigUseCase();
        const { fiscalConfig } = await useCase.execute({ tenantId });

        return reply.status(200).send({
          config: {
            id: fiscalConfig.id.toString(),
            tenantId: fiscalConfig.tenantId.toString(),
            provider: fiscalConfig.provider,
            environment: fiscalConfig.environment,
            defaultSeries: fiscalConfig.defaultSeries,
            lastNfeNumber: fiscalConfig.lastNfeNumber,
            lastNfceNumber: fiscalConfig.lastNfceNumber,
            defaultCfop: fiscalConfig.defaultCfop,
            defaultNaturezaOperacao: fiscalConfig.defaultNaturezaOperacao,
            taxRegime: fiscalConfig.taxRegime,
            nfceEnabled: fiscalConfig.nfceEnabled,
            contingencyMode: fiscalConfig.contingencyMode,
            createdAt: fiscalConfig.createdAt,
            updatedAt: fiscalConfig.updatedAt ?? null,
          },
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
