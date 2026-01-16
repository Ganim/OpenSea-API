import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  generateLabelsResponseSchema,
  generateLabelsSchema,
} from '@/http/schemas';
import { makeGenerateLabelsUseCase } from '@/use-cases/stock/labels/factories/make-generate-labels-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function generateLabelsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/labels/generate',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.BINS.READ,
        resource: 'labels',
      }),
    ],
    schema: {
      tags: ['Stock - Labels'],
      summary: 'Generate labels for bins',
      description:
        'Generates label data for the specified bins, including QR code or barcode data.',
      body: generateLabelsSchema,
      response: {
        200: generateLabelsResponseSchema,
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { binIds, format, size, includeWarehouse, includeZone } =
        request.body;

      try {
        const generateLabelsUseCase = makeGenerateLabelsUseCase();
        const result = await generateLabelsUseCase.execute({
          binIds,
          format,
          size,
          includeWarehouse,
          includeZone,
        });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
