import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas';
import { makeDeleteBonusUseCase } from '@/use-cases/hr/bonuses/factories/make-delete-bonus-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1DeleteBonusController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/bonuses/:bonusId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.PAYROLL.ADMIN,
        resource: 'bonuses',
      }),
    ],
    schema: {
      tags: ['HR - Bonus'],
      summary: 'Delete a bonus',
      description: 'Soft deletes a bonus',
      params: z.object({
        bonusId: idSchema,
      }),
      response: {
        204: z.null(),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { bonusId } = request.params;

      try {
        const deleteBonusUseCase = makeDeleteBonusUseCase();
        await deleteBonusUseCase.execute({ tenantId, bonusId });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.BONUS_DELETE,
          entityId: bonusId,
          placeholders: {
            userName: request.user.sub,
            employeeName: bonusId,
          },
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (
          error instanceof Error &&
          error.message.toLowerCase().includes('not found')
        ) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
