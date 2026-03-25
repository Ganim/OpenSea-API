import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createPixChargeBodySchema,
  createPixChargeResponseSchema,
} from '@/http/schemas/cashier/pix.schema';
import { makeCreatePixChargeUseCase } from '@/use-cases/cashier/factories/make-create-pix-charge-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreatePixChargeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/cashier/pix',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Cashier - PIX'],
      summary: 'Create a PIX charge (QR Code)',
      description:
        'Creates a new PIX charge through the configured provider (e.g. Efi). Returns the QR Code URL, copia-e-cola string, and charge details.',
      body: createPixChargeBodySchema,
      response: {
        201: createPixChargeResponseSchema,
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { amount, description, orderId, posTransactionPaymentId } =
        request.body;

      const useCase = makeCreatePixChargeUseCase();
      const { pixCharge } = await useCase.execute({
        tenantId,
        amount,
        description,
        orderId,
        posTransactionPaymentId,
      });

      return reply.status(201).send({
        pixCharge: {
          id: pixCharge.pixChargeId.toString(),
          tenantId: pixCharge.tenantId,
          txId: pixCharge.txId,
          location: pixCharge.location,
          pixCopiaECola: pixCharge.pixCopiaECola,
          amount: pixCharge.amount,
          status: pixCharge.status,
          payerName: pixCharge.payerName,
          payerCpfCnpj: pixCharge.payerCpfCnpj,
          endToEndId: pixCharge.endToEndId,
          posTransactionPaymentId: pixCharge.posTransactionPaymentId,
          orderId: pixCharge.orderId,
          expiresAt: pixCharge.expiresAt.toISOString(),
          paidAt: pixCharge.paidAt?.toISOString() ?? null,
          provider: pixCharge.provider,
          createdAt: pixCharge.createdAt.toISOString(),
        },
      });
    },
  });
}
