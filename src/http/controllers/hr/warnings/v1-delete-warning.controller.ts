import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas';
import { makeDeleteWarningUseCase } from '@/use-cases/hr/warnings/factories/make-delete-warning-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1DeleteWarningController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/warnings/:warningId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.WARNINGS.REMOVE,
        resource: 'warnings',
      }),
    ],
    schema: {
      tags: ['HR - Warnings'],
      summary: 'Delete employee warning',
      description: 'Soft-deletes an employee warning',
      params: z.object({
        warningId: idSchema,
      }),
      response: {
        204: z.void(),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { warningId } = request.params;

      try {
        const deleteWarningUseCase = makeDeleteWarningUseCase();
        await deleteWarningUseCase.execute({ tenantId, warningId });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.WARNING_DELETE,
          entityId: warningId,
          placeholders: {},
        });

        return reply.status(204).send();
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
