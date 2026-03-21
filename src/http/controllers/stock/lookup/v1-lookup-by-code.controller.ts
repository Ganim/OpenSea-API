import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeLookupByCodeUseCase } from '@/use-cases/stock/lookup/factories/make-lookup-by-code-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function lookupByCodeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/stock/lookup/:code',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Stock - Lookup'],
      summary: 'Lookup entity by scanned code (QR/barcode/fullCode/address)',
      params: z.object({
        code: z.string().min(1),
      }),
      response: {
        200: z.object({
          entityType: z.enum(['ITEM', 'VARIANT', 'PRODUCT', 'BIN']),
          entityId: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { code } = request.params;

      const lookupUseCase = makeLookupByCodeUseCase();

      try {
        const { entityType, entity } = await lookupUseCase.execute({
          tenantId,
          code: decodeURIComponent(code),
        });

        return reply.status(200).send({
          entityType,
          entityId: entity.id.toString(),
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
