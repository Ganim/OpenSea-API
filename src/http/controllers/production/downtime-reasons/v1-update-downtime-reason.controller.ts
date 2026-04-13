import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateDowntimeReasonSchema,
  downtimeReasonResponseSchema,
} from '@/http/schemas/production';
import { downtimeReasonToDTO } from '@/mappers/production/downtime-reason-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetDowntimeReasonByIdUseCase } from '@/use-cases/production/downtime-reasons/factories/make-get-downtime-reason-by-id-use-case';
import { makeUpdateDowntimeReasonUseCase } from '@/use-cases/production/downtime-reasons/factories/make-update-downtime-reason-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateDowntimeReasonController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
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
      summary: 'Update a downtime reason',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: updateDowntimeReasonSchema,
      response: {
        200: z.object({
          downtimeReason: downtimeReasonResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const { name, category, isActive } = request.body;
      const userId = request.user.sub;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const getDowntimeReasonByIdUseCase = makeGetDowntimeReasonByIdUseCase();

      const [{ user }, { downtimeReason: oldDowntimeReason }] =
        await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getDowntimeReasonByIdUseCase.execute({ tenantId, id }),
        ]);
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const updateDowntimeReasonUseCase = makeUpdateDowntimeReasonUseCase();
      const { downtimeReason } = await updateDowntimeReasonUseCase.execute({
        tenantId,
        id,
        name,
        category,
        isActive,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.DOWNTIME_REASON_UPDATE,
        entityId: downtimeReason.id.toString(),
        placeholders: { userName, name: downtimeReason.name },
        oldData: { name: oldDowntimeReason.name },
        newData: { name, category, isActive },
      });

      return reply
        .status(200)
        .send({ downtimeReason: downtimeReasonToDTO(downtimeReason) });
    },
  });
}
