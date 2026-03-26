import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  customerPriceResponseSchema,
  updateCustomerPriceSchema,
} from '@/http/schemas';
import { makeUpdateCustomerPriceUseCase } from '@/use-cases/sales/customer-prices/factories/make-update-customer-price-use-case';
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

      try {
        const useCase = makeUpdateCustomerPriceUseCase();
        const { customerPrice } = await useCase.execute({
          id,
          tenantId,
          price: body.price,
          validFrom: body.validFrom,
          validUntil: body.validUntil,
          notes: body.notes,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.CUSTOMER_PRICE_UPDATE,
          entityId: customerPrice.id.toString(),
          placeholders: {
            userName: userId,
            customerId: customerPrice.customerId.toString(),
          },
          oldData: { price: customerPrice.price },
          newData: { price: body.price },
        });

        return reply.status(200).send({
          customerPrice: {
            id: customerPrice.id.toString(),
            tenantId: customerPrice.tenantId.toString(),
            customerId: customerPrice.customerId.toString(),
            variantId: customerPrice.variantId.toString(),
            price: customerPrice.price,
            validFrom: customerPrice.validFrom ?? null,
            validUntil: customerPrice.validUntil ?? null,
            notes: customerPrice.notes ?? null,
            createdByUserId: customerPrice.createdByUserId.toString(),
            createdAt: customerPrice.createdAt,
            updatedAt: customerPrice.updatedAt ?? null,
          },
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
