import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { couponResponseSchema, updateCouponSchema } from '@/http/schemas';
import { makeGetCouponByIdUseCase } from '@/use-cases/sales/coupons/factories/make-get-coupon-by-id-use-case';
import { makeUpdateCouponUseCase } from '@/use-cases/sales/coupons/factories/make-update-coupon-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateCouponController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/coupons/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.COUPONS.MODIFY,
        resource: 'coupons',
      }),
    ],
    schema: {
      tags: ['Sales - Coupons'],
      summary: 'Update a coupon',
      params: z.object({
        id: z.string().uuid().describe('Coupon UUID'),
      }),
      body: updateCouponSchema,
      response: {
        200: z.object({
          coupon: couponResponseSchema,
        }),
        404: z.object({ message: z.string() }),
        409: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id } = request.params;
      const body = request.body;

      try {
        // Get existing for audit
        const getUseCase = makeGetCouponByIdUseCase();
        const { coupon: existing } = await getUseCase.execute({ id, tenantId });

        const useCase = makeUpdateCouponUseCase();
        const { coupon } = await useCase.execute({
          id,
          tenantId,
          code: body.code,
          isActive: body.isActive,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.COUPON_UPDATE,
          entityId: coupon.couponId.toString(),
          placeholders: {
            userName: userId,
            couponCode: coupon.code,
          },
          oldData: {
            code: existing.code,
            type: existing.discountType,
            value: existing.discountValue,
          },
          newData: {
            code: coupon.code,
            type: coupon.discountType,
            value: coupon.discountValue,
          },
        });

        return reply.status(200).send({
          coupon: {
            id: coupon.couponId.toString(),
            tenantId: coupon.tenantId.toString(),
            code: coupon.code,
            type: coupon.discountType,
            value: coupon.discountValue,
            applicableTo: coupon.applicableTo,
            minOrderValue: coupon.minOrderValue ?? null,
            maxDiscount: coupon.maxDiscountAmount ?? null,
            maxUsageTotal: coupon.maxUsageTotal ?? null,
            maxUsagePerCustomer: coupon.maxUsagePerCustomer ?? 0,
            usageCount: coupon.currentUsageTotal,
            validFrom: coupon.startDate ?? new Date(),
            validUntil: coupon.endDate ?? new Date(),
            isActive: coupon.isActive,
            campaignId: null,
            aiGenerated: false,
            aiReason: null,
            customerId: null,
            targetIds: [],
            createdAt: coupon.createdAt,
            updatedAt: coupon.updatedAt,
          },
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof ConflictError) {
          return reply.status(409).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
