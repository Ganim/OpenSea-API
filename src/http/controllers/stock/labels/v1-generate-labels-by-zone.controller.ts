import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  generateLabelsByZoneSchema,
  generateLabelsResponseSchema,
} from '@/http/schemas';
import { makeGenerateLabelsByZoneUseCase } from '@/use-cases/stock/labels/factories/make-generate-labels-by-zone-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function generateLabelsByZoneController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/labels/generate-by-zone',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.BINS.READ,
        resource: 'labels',
      }),
    ],
    schema: {
      tags: ['Stock - Labels'],
      summary: 'Generate labels for bins in a zone',
      description:
        'Generates label data for bins in a zone with optional filters for aisles, shelves, and positions.',
      body: generateLabelsByZoneSchema,
      response: {
        200: generateLabelsResponseSchema,
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const {
        zoneId,
        format,
        size,
        aisles,
        shelvesFrom,
        shelvesTo,
        positions,
        includeWarehouse,
        includeZone,
      } = request.body;

      try {
        const generateLabelsByZoneUseCase = makeGenerateLabelsByZoneUseCase();
        const result = await generateLabelsByZoneUseCase.execute({
          zoneId,
          format,
          size,
          aisles,
          shelvesFrom,
          shelvesTo,
          positions,
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
