import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteCustomerPriceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/customer-prices/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CUSTOMER_PRICES.REMOVE,
        resource: 'customer-prices',
      }),
    ],
    schema: {
      tags: ['Sales - Customer Prices'],
      summary: 'Delete a customer-specific price',
      params: z.object({
        id: z.string().uuid().describe('Customer price UUID'),
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

      const existing = await prisma.customerPrice.findFirst({
        where: { id, tenantId },
      });

      if (!existing) {
        return reply.status(404).send({ message: 'Customer price not found' });
      }

      await prisma.customerPrice.delete({ where: { id } });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.CUSTOMER_PRICE_DELETE,
        entityId: id,
        placeholders: {
          userName: userId,
          customerId: existing.customerId,
        },
        oldData: {
          customerId: existing.customerId,
          variantId: existing.variantId,
          price: Number(existing.price),
        },
      });

      return reply.status(204).send(null);
    },
  });
}
