import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { customerPriceResponseSchema, listCustomerPricesQuerySchema } from '@/http/schemas';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listCustomerPricesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/customer-prices',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CUSTOMER_PRICES.ACCESS,
        resource: 'customer-prices',
      }),
    ],
    schema: {
      tags: ['Sales - Customer Prices'],
      summary: 'List customer-specific prices',
      querystring: listCustomerPricesQuerySchema,
      response: {
        200: z.object({
          customerPrices: z.array(customerPriceResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, limit, customerId, variantId, sortBy, sortOrder } = request.query;

      const where = {
        tenantId,
        ...(customerId && { customerId }),
        ...(variantId && { variantId }),
      };

      const [customerPrices, total] = await Promise.all([
        prisma.customerPrice.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { [sortBy ?? 'createdAt']: sortOrder ?? 'desc' },
        }),
        prisma.customerPrice.count({ where }),
      ]);

      return reply.status(200).send({
        customerPrices: customerPrices.map((cp) => ({
          ...cp,
          price: Number(cp.price),
          validFrom: cp.validFrom ?? null,
          validUntil: cp.validUntil ?? null,
          notes: cp.notes ?? null,
        })),
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    },
  });
}
