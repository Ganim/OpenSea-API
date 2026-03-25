import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listPixChargesQuerySchema,
  listPixChargesResponseSchema,
} from '@/http/schemas/cashier/pix.schema';
import { calculateOffsetMeta } from '@/http/schemas/pagination.schema';
import { makeListPixChargesUseCase } from '@/use-cases/cashier/factories/make-list-pix-charges-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function v1ListPixChargesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/cashier/pix',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Cashier - PIX'],
      summary: 'List PIX charges',
      description:
        'Lists PIX charges for the current tenant with optional status filtering and offset pagination.',
      querystring: listPixChargesQuerySchema,
      response: {
        200: listPixChargesResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, limit, status } = request.query;

      const useCase = makeListPixChargesUseCase();
      const { charges, total } = await useCase.execute({
        tenantId,
        page,
        limit,
        status,
      });

      const formattedCharges = charges.map((charge) => ({
        id: charge.pixChargeId.toString(),
        tenantId: charge.tenantId,
        txId: charge.txId,
        location: charge.location,
        pixCopiaECola: charge.pixCopiaECola,
        amount: charge.amount,
        status: charge.status,
        payerName: charge.payerName,
        payerCpfCnpj: charge.payerCpfCnpj,
        endToEndId: charge.endToEndId,
        posTransactionPaymentId: charge.posTransactionPaymentId,
        orderId: charge.orderId,
        expiresAt: charge.expiresAt.toISOString(),
        paidAt: charge.paidAt?.toISOString() ?? null,
        provider: charge.provider,
        createdAt: charge.createdAt.toISOString(),
      }));

      return reply.status(200).send({
        data: formattedCharges,
        meta: calculateOffsetMeta(total, page, limit),
      });
    },
  });
}
