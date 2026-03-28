import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas';
import {
  revokeWarningSchema,
  warningResponseSchema,
} from '@/http/schemas/hr/warnings';
import { employeeWarningToDTO } from '@/mappers/hr/employee-warning';
import { makeRevokeWarningUseCase } from '@/use-cases/hr/warnings/factories/make-revoke-warning-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1RevokeWarningController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/warnings/:warningId/revoke',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.WARNINGS.ADMIN,
        resource: 'warnings',
      }),
    ],
    schema: {
      tags: ['HR - Warnings'],
      summary: 'Revoke employee warning',
      description: 'Revokes an active employee warning with a reason',
      params: z.object({
        warningId: idSchema,
      }),
      body: revokeWarningSchema,
      response: {
        200: z.object({
          warning: warningResponseSchema,
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { warningId } = request.params;
      const { revokeReason } = request.body;

      try {
        const revokeWarningUseCase = makeRevokeWarningUseCase();
        const { warning } = await revokeWarningUseCase.execute({
          tenantId,
          warningId,
          revokeReason,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.WARNING_REVOKE,
          entityId: warning.id.toString(),
          placeholders: {
            employeeName: warning.employeeId.toString(),
          },
          newData: { revokeReason },
        });

        return reply
          .status(200)
          .send({ warning: employeeWarningToDTO(warning) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
