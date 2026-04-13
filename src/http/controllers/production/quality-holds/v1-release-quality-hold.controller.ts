import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  releaseQualityHoldSchema,
  qualityHoldResponseSchema,
} from '@/http/schemas/production';
import { qualityHoldToDTO } from '@/mappers/production/quality-hold-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeReleaseQualityHoldUseCase } from '@/use-cases/production/quality-holds/factories/make-release-quality-hold-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function releaseQualityHoldController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/production/quality-holds/:qualityHoldId/release',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.QUALITY.MODIFY,
        resource: 'quality-holds',
      }),
    ],
    schema: {
      tags: ['Production - Quality'],
      summary: 'Release a quality hold',
      params: z.object({
        qualityHoldId: z.string(),
      }),
      body: releaseQualityHoldSchema,
      response: {
        200: z.object({
          qualityHold: qualityHoldResponseSchema,
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
      const userId = request.user.sub;
      const { qualityHoldId } = request.params;
      const { resolution } = request.body;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const releaseQualityHoldUseCase = makeReleaseQualityHoldUseCase();
      const { qualityHold } = await releaseQualityHoldUseCase.execute({
        qualityHoldId,
        releasedById: userId,
        resolution,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.QUALITY_HOLD_RELEASE,
        entityId: qualityHoldId,
        placeholders: {
          userName,
          orderNumber: qualityHold.productionOrderId.toString(),
        },
        newData: { resolution },
      });

      return reply
        .status(200)
        .send({ qualityHold: qualityHoldToDTO(qualityHold) });
    },
  });
}
