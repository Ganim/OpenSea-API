import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { envelopeDetailResponseSchema } from '@/http/schemas/signature/signature.schema';
import { signatureEnvelopeToDTO } from '@/mappers/signature';
import { makeGetQuoteSignatureStatusUseCase } from '@/use-cases/sales/signatures/factories/make-get-quote-signature-status-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getQuoteSignatureStatusController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/quotes/:id/signature-status',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.QUOTES.ACCESS,
        resource: 'quotes',
      }),
    ],
    schema: {
      tags: ['Sales - Quotes'],
      summary: 'Get signature status for a quote',
      description:
        'Returns the signature envelope and signer statuses for a quote that has been sent for signing.',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          envelope: envelopeDetailResponseSchema,
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeGetQuoteSignatureStatusUseCase();
        const { envelope } = await useCase.execute({
          tenantId,
          quoteId: id,
        });

        return reply
          .status(200)
          .send({ envelope: signatureEnvelopeToDTO(envelope) });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
