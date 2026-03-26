import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createCustomerPriceSchema,
  customerPriceResponseSchema,
} from '@/http/schemas';
import { makeCreateCustomerPriceUseCase } from '@/use-cases/sales/customer-prices/factories/make-create-customer-price-use-case';
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

      try {
        const useCase = makeCreateCustomerPriceUseCase();
        const { customerPrice } = await useCase.execute({
          tenantId,
          customerId: body.customerId,
          variantId: body.variantId,
          price: body.price,
          validFrom: body.validFrom,
          validUntil: body.validUntil,
          notes: body.notes,
          createdByUserId: userId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.CUSTOMER_PRICE_CREATE,
          entityId: customerPrice.id.toString(),
          placeholders: {
            userName: userId,
            customerId: body.customerId,
          },
          newData: {
            customerId: body.customerId,
            variantId: body.variantId,
            price: body.price,
          },
        });

        return reply.status(201).send({
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
        if (
          error instanceof ResourceNotFoundError ||
          error instanceof ConflictError
        ) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
