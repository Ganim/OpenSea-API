import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { variantPromotionResponseSchema } from '@/http/schemas/sales.schema';
import { variantPromotionToDTO } from '@/mappers/sales/variant-promotion/variant-promotion-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeDeleteVariantPromotionUseCase } from '@/use-cases/sales/variant-promotions/factories/make-delete-variant-promotion-use-case';
import { makeGetVariantPromotionByIdUseCase } from '@/use-cases/sales/variant-promotions/factories/make-get-variant-promotion-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteVariantPromotionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/variant-promotions/:id',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PROMOTIONS.DELETE,
        resource: 'variant-promotions',
      }),
    ],
    schema: {
      tags: ['Sales - Variant Promotions'],
      summary: 'Delete a variant promotion (soft delete)',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ promotion: variantPromotionResponseSchema }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.sub;

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

        const useCase = makeDeleteVariantPromotionUseCase();
        const { promotion } = await useCase.execute({ id });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.VARIANT_PROMOTION_DELETE,
          entityId: id,
          placeholders: {
            userName,
            variantName: oldPromotion.variantId,
          },
          oldData: { discountValue: oldPromotion.discountValue },
        });

        return reply
          .status(200)
          .send({ promotion: variantPromotionToDTO(promotion) });
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
