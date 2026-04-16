import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListPaymentLinksUseCase } from '@/use-cases/finance/payment-links/factories/make-list-payment-links-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listPaymentLinksController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/payment-links',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.PAYMENT_LINKS.ACCESS,
        resource: 'payment-links',
      }),
    ],
    schema: {
      tags: ['Finance - Payment Links'],
      summary: 'List payment links',
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
        status: z.enum(['ACTIVE', 'PAID', 'EXPIRED', 'CANCELLED']).optional(),
      }),
      response: {
        200: z.object({
          paymentLinks: z.array(
            z.object({
              id: z.string(),
              slug: z.string(),
              amount: z.number(),
              description: z.string(),
              customerName: z.string().nullable(),
              status: z.string(),
              expiresAt: z.string().nullable(),
              paidAt: z.string().nullable(),
              createdAt: z.string(),
            }),
          ),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, limit, status } = request.query;

      const useCase = makeListPaymentLinksUseCase();
      const result = await useCase.execute({
        tenantId,
        page,
        limit,
        status,
      });

      return reply.status(200).send({
        paymentLinks: result.paymentLinks.map((link) => ({
          id: link.id,
          slug: link.slug,
          amount: link.amount,
          description: link.description,
          customerName: link.customerName,
          status: link.status,
          expiresAt: link.expiresAt?.toISOString() ?? null,
          paidAt: link.paidAt?.toISOString() ?? null,
          createdAt: link.createdAt.toISOString(),
        })),
        meta: result.meta,
      });
    },
  });
}
