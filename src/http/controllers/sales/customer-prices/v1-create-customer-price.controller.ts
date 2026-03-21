import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createCustomerPriceSchema, customerPriceResponseSchema } from '@/http/schemas';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createCustomerPriceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/customer-prices',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CUSTOMER_PRICES.REGISTER,
        resource: 'customer-prices',
      }),
    ],
    schema: {
      tags: ['Sales - Customer Prices'],
      summary: 'Create a customer-specific price',
      body: createCustomerPriceSchema,
      response: {
        201: z.object({
          customerPrice: customerPriceResponseSchema,
        }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const body = request.body;

      const customerPrice = await prisma.customerPrice.create({
        data: {
          tenantId,
          customerId: body.customerId,
          variantId: body.variantId,
          price: body.price,
          validFrom: body.validFrom,
          validUntil: body.validUntil,
          notes: body.notes,
          createdByUserId: userId,
        },
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.CUSTOMER_PRICE_CREATE,
        entityId: customerPrice.id,
        placeholders: {
          userName: userId,
          customerId: body.customerId,
        },
        newData: { customerId: body.customerId, variantId: body.variantId, price: body.price },
      });

      return reply.status(201).send({
        customerPrice: {
          ...customerPrice,
          price: Number(customerPrice.price),
          validFrom: customerPrice.validFrom ?? null,
          validUntil: customerPrice.validUntil ?? null,
          notes: customerPrice.notes ?? null,
        },
      });
    },
  });
}
