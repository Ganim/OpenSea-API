import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createQualityHoldSchema,
  qualityHoldResponseSchema,
} from '@/http/schemas/production';
import { qualityHoldToDTO } from '@/mappers/production/quality-hold-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateQualityHoldUseCase } from '@/use-cases/production/quality-holds/factories/make-create-quality-hold-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createQualityHoldController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/quality-holds',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.QUALITY.REGISTER,
        resource: 'quality-holds',
      }),
    ],
    schema: {
      tags: ['Production - Quality'],
      summary: 'Create a quality hold',
      body: createQualityHoldSchema,
      response: {
        201: z.object({
          qualityHold: qualityHoldResponseSchema,
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { productionOrderId, reason } = request.body;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const createQualityHoldUseCase = makeCreateQualityHoldUseCase();
      const { qualityHold } = await createQualityHoldUseCase.execute({
        productionOrderId,
        reason,
        holdById: userId,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.QUALITY_HOLD_CREATE,
        entityId: qualityHold.qualityHoldId.toString(),
        placeholders: { userName, orderNumber: productionOrderId },
        newData: { productionOrderId, reason },
      });

      return reply
        .status(201)
        .send({ qualityHold: qualityHoldToDTO(qualityHold) });
    },
  });
}
