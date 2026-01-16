import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  updateVariantPromotionSchema,
  variantPromotionResponseSchema,
} from '@/http/schemas/sales.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetVariantPromotionByIdUseCase } from '@/use-cases/sales/variant-promotions/factories/make-get-variant-promotion-by-id-use-case';
import { makeUpdateVariantPromotionUseCase } from '@/use-cases/sales/variant-promotions/factories/make-update-variant-promotion-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateVariantPromotionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/variant-promotions/:id',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PROMOTIONS.UPDATE,
        resource: 'variant-promotions',
      }),
    ],
    schema: {
      tags: ['Sales - Variant Promotions'],
      summary: 'Update a variant promotion',
      params: z.object({ id: z.string().uuid() }),
      body: updateVariantPromotionSchema,
      response: {
        200: z.object({ promotion: variantPromotionResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.sub;
      const data = request.body;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getVariantPromotionByIdUseCase =
          makeGetVariantPromotionByIdUseCase();

        const [{ user }, { promotion: oldPromotion }] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getVariantPromotionByIdUseCase.execute({ id }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeUpdateVariantPromotionUseCase();
        const { promotion } = await useCase.execute({ id, ...data });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.VARIANT_PROMOTION_UPDATE,
          entityId: id,
          placeholders: {
            userName,
            variantName: promotion.variantId || oldPromotion.variantId,
          },
          oldData: { discountValue: oldPromotion.discountValue },
          newData: data,
        });

        return reply.status(200).send({ promotion });
      } catch (err) {
        if (err instanceof BadRequestError) {
          return reply.status(400).send({ message: err.message });
        }
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
