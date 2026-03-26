import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeUpdateHrConfigUseCase } from '@/use-cases/hr/hr-config/factories/make-update-hr-config-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import {
  hrConfigResponseSchema,
  hrConfigToDTO,
  updateHrConfigBodySchema,
} from './shared';

export async function v1UpdateHrConfigController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
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
      summary: 'Update HR tenant configuration',
      description:
        'Updates the HR configuration for the tenant (Empresa Cidadã, contribuição sindical, GPS, etc.)',
      body: updateHrConfigBodySchema,
      response: {
        200: z.object({
          hrConfig: hrConfigResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const useCase = makeUpdateHrConfigUseCase();
        const { hrConfig } = await useCase.execute({ tenantId, data });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.HR_CONFIG_UPDATE,
          entityId: hrConfig.id.toString(),
        });

        return reply.status(200).send({
          hrConfig: hrConfigToDTO(hrConfig),
        });
      } catch (error) {
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
