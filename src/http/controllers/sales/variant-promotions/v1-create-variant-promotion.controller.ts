import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  createVariantPromotionSchema,
  variantPromotionResponseSchema,
} from '@/http/schemas/sales.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateVariantPromotionUseCase } from '@/use-cases/sales/variant-promotions/factories/make-create-variant-promotion-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createVariantPromotionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/variant-promotions',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PROMOTIONS.CREATE,
        resource: 'variant-promotions',
      }),
    ],
    schema: {
      tags: ['Sales - Variant Promotions'],
      summary: 'Create a new variant promotion',
      body: createVariantPromotionSchema,
      response: {
        201: z.object({ promotion: variantPromotionResponseSchema }),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const data = request.body;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeCreateVariantPromotionUseCase();
        const { promotion } = await useCase.execute(data);

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.VARIANT_PROMOTION_CREATE,
          entityId: promotion.id,
          placeholders: {
            userName,
            variantName: promotion.variantId || data.variantId,
            discountPercent: String(data.discountValue || 0),
          },
          newData: {
            variantId: data.variantId,
            discountValue: data.discountValue,
            discountType: data.discountType,
          },
        });

        return reply.status(201).send({ promotion });
      } catch (err) {
        if (err instanceof BadRequestError) {
          return reply.status(400).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
