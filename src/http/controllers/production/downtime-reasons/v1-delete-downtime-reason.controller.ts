import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeDeleteDowntimeReasonUseCase } from '@/use-cases/production/downtime-reasons/factories/make-delete-downtime-reason-use-case';
import { makeGetDowntimeReasonByIdUseCase } from '@/use-cases/production/downtime-reasons/factories/make-get-downtime-reason-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteDowntimeReasonController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/production/downtime-reasons/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.SHOPFLOOR.MODIFY,
        resource: 'downtime-reasons',
      }),
    ],
    schema: {
      tags: ['Production - Shop Floor'],
      summary: 'Delete a downtime reason',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        204: z.null().describe('Downtime reason deleted successfully'),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const userId = request.user.sub;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const getDowntimeReasonByIdUseCase = makeGetDowntimeReasonByIdUseCase();

      const [{ user }, { downtimeReason }] = await Promise.all([
        getUserByIdUseCase.execute({ userId }),
        getDowntimeReasonByIdUseCase.execute({ tenantId, id }),
      ]);
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const deleteDowntimeReasonUseCase = makeDeleteDowntimeReasonUseCase();
      await deleteDowntimeReasonUseCase.execute({ tenantId, id });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.DOWNTIME_REASON_DELETE,
        entityId: id,
        placeholders: { userName, name: downtimeReason.name },
        oldData: {
          id: downtimeReason.id.toString(),
          name: downtimeReason.name,
        },
      });

      return reply.status(204).send(null);
    },
  });
}
