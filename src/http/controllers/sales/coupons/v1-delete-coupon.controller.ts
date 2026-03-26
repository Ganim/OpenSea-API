import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetCouponByIdUseCase } from '@/use-cases/sales/coupons/factories/make-get-coupon-by-id-use-case';
import { makeDeleteCouponUseCase } from '@/use-cases/sales/coupons/factories/make-delete-coupon-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteCouponController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/coupons/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.COUPONS.REMOVE,
        resource: 'coupons',
      }),
    ],
    schema: {
      tags: ['Sales - Coupons'],
      summary: 'Delete a coupon',
      params: z.object({
        id: z.string().uuid().describe('Coupon UUID'),
      }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id } = request.params;

      try {
        // Get existing for audit
        const getUseCase = makeGetCouponByIdUseCase();
        const { coupon: existing } = await getUseCase.execute({ id, tenantId });

        const useCase = makeDeleteCouponUseCase();
        await useCase.execute({ id, tenantId });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.COUPON_DELETE,
          entityId: id,
          placeholders: {
            userName: userId,
            couponCode: existing.code,
          },
          oldData: { code: existing.code, type: existing.discountType },
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
