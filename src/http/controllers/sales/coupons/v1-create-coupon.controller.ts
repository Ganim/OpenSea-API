import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { couponResponseSchema, createCouponSchema } from '@/http/schemas';
import { makeCreateCouponUseCase } from '@/use-cases/sales/coupons/factories/make-create-coupon-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createCouponController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/coupons',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.COUPONS.REGISTER,
        resource: 'coupons',
      }),
    ],
    schema: {
      tags: ['Sales - Coupons'],
      summary: 'Create a new coupon',
      body: createCouponSchema,
      response: {
        201: z.object({
          coupon: couponResponseSchema,
        }),
        400: z.object({ message: z.string() }),
        409: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const body = request.body;

      try {
        const useCase = makeCreateCouponUseCase();
        const { coupon } = await useCase.execute({
          tenantId,
          code: body.code,
          discountType: (body.type ?? 'PERCENTAGE') as 'PERCENTAGE',
          discountValue: Number(body.value),
          applicableTo: body.applicableTo ?? 'ALL',
          minOrderValue: body.minOrderValue
            ? Number(body.minOrderValue)
            : undefined,
          maxDiscountAmount: body.maxDiscount
            ? Number(body.maxDiscount)
            : undefined,
          maxUsageTotal: body.maxUsageTotal,
          maxUsagePerCustomer: body.maxUsagePerCustomer,
          startDate: body.validFrom,
          endDate: body.validUntil,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.COUPON_CREATE,
          entityId: coupon.couponId.toString(),
          placeholders: {
            userName: userId,
            couponCode: coupon.code,
          },
          newData: { code: body.code, type: body.type, value: body.value },
        });

        return reply.status(201).send({
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
        if (error instanceof ConflictError) {
          return reply.status(409).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
