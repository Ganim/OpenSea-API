import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createDowntimeReasonSchema,
  downtimeReasonResponseSchema,
} from '@/http/schemas/production';
import { downtimeReasonToDTO } from '@/mappers/production/downtime-reason-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateDowntimeReasonUseCase } from '@/use-cases/production/downtime-reasons/factories/make-create-downtime-reason-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createDowntimeReasonController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/downtime-reasons',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.SHOPFLOOR.REGISTER,
        resource: 'downtime-reasons',
      }),
    ],
    schema: {
      tags: ['Production - Shop Floor'],
      summary: 'Create a new downtime reason',
      body: createDowntimeReasonSchema,
      response: {
        201: z.object({
          downtimeReason: downtimeReasonResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { code, name, category, isActive } = request.body;
      const userId = request.user.sub;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const createDowntimeReasonUseCase = makeCreateDowntimeReasonUseCase();
      const { downtimeReason } = await createDowntimeReasonUseCase.execute({
        tenantId,
        code,
        name,
        category,
        isActive,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.DOWNTIME_REASON_CREATE,
        entityId: downtimeReason.id.toString(),
        placeholders: { userName, name: downtimeReason.name },
        newData: { code, name, category, isActive },
      });

      return reply
        .status(201)
        .send({ downtimeReason: downtimeReasonToDTO(downtimeReason) });
    },
  });
}
