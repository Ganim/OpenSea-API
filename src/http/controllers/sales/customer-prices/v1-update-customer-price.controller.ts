import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { customerPriceResponseSchema, updateCustomerPriceSchema } from '@/http/schemas';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateCustomerPriceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/customer-prices/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CUSTOMER_PRICES.MODIFY,
        resource: 'customer-prices',
      }),
    ],
    schema: {
      tags: ['Sales - Customer Prices'],
      summary: 'Update a customer-specific price',
      params: z.object({
        id: z.string().uuid().describe('Customer price UUID'),
      }),
      body: updateCustomerPriceSchema,
      response: {
        200: z.object({
          customerPrice: customerPriceResponseSchema,
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id } = request.params;
      const body = request.body;

      const existing = await prisma.customerPrice.findFirst({
        where: { id, tenantId },
      });

      if (!existing) {
        return reply.status(404).send({ message: 'Customer price not found' });
      }

      const customerPrice = await prisma.customerPrice.update({
        where: { id },
        data: body,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.CUSTOMER_PRICE_UPDATE,
        entityId: customerPrice.id,
        placeholders: {
          userName: userId,
          customerId: existing.customerId,
        },
        oldData: { price: Number(existing.price) },
        newData: { price: body.price },
      });

      return reply.status(200).send({
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
