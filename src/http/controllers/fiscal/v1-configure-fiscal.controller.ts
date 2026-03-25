import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  configureFiscalBodySchema,
  fiscalConfigResponseSchema,
} from '@/http/schemas/fiscal';
import { makeConfigureFiscalUseCase } from '@/use-cases/fiscal/config/factories/make-configure-fiscal-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function configureFiscalController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/fiscal/config',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SYSTEM.FISCAL.ADMIN,
        resource: 'fiscal',
      }),
    ],
    schema: {
      tags: ['Fiscal'],
      summary: 'Create or update fiscal configuration',
      body: configureFiscalBodySchema,
      response: {
        200: z.object({ config: fiscalConfigResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeConfigureFiscalUseCase();
      const { fiscalConfig } = await useCase.execute({
        tenantId,
        ...request.body,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.FISCAL.CONFIG_UPSERT,
        entityId: fiscalConfig.id.toString(),
        placeholders: {
          userName: request.user.sub,
          provider: fiscalConfig.provider,
          environment: fiscalConfig.environment,
        },
        newData: {
          provider: request.body.provider,
          environment: request.body.environment,
          defaultCfop: request.body.defaultCfop,
          taxRegime: request.body.taxRegime,
        },
      });

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
    },
  });
}
