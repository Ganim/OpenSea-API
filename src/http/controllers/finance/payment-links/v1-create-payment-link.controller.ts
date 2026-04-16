import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCreatePaymentLinkUseCase } from '@/use-cases/finance/payment-links/factories/make-create-payment-link-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createPaymentLinkController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/payment-links',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.PAYMENT_LINKS.REGISTER,
        resource: 'payment-links',
      }),
    ],
    schema: {
      tags: ['Finance - Payment Links'],
      summary: 'Create a shareable payment link',
      security: [{ bearerAuth: [] }],
      body: z.object({
        amount: z.number().positive(),
        description: z.string().min(1).max(500),
        customerName: z.string().max(128).optional(),
        entryId: z.string().uuid().optional(),
        expiresAt: z.string().datetime().optional(),
        enablePix: z.boolean().optional().default(true),
        enableBoleto: z.boolean().optional().default(false),
      }),
      response: {
        201: z.object({
          paymentLink: z.object({
            id: z.string(),
            slug: z.string(),
            amount: z.number(),
            description: z.string(),
            customerName: z.string().nullable(),
            status: z.string(),
            expiresAt: z.string().nullable(),
            pixCopiaECola: z.string().nullable(),
            boletoDigitableLine: z.string().nullable(),
            boletoPdfUrl: z.string().nullable(),
            createdAt: z.string(),
          }),
          url: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { amount, description, customerName, entryId, expiresAt } =
        request.body;

      const useCase = makeCreatePaymentLinkUseCase();
      const result = await useCase.execute({
        tenantId,
        entryId,
        amount,
        description,
        customerName,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });

      return reply.status(201).send({
        paymentLink: {
          id: result.paymentLink.id,
          slug: result.paymentLink.slug,
          amount: result.paymentLink.amount,
          description: result.paymentLink.description,
          customerName: result.paymentLink.customerName,
          status: result.paymentLink.status,
          expiresAt: result.paymentLink.expiresAt?.toISOString() ?? null,
          pixCopiaECola: result.paymentLink.pixCopiaECola,
          boletoDigitableLine: result.paymentLink.boletoDigitableLine,
          boletoPdfUrl: result.paymentLink.boletoPdfUrl,
          createdAt: result.paymentLink.createdAt.toISOString(),
        },
        url: result.url,
      });
    },
  });
}
