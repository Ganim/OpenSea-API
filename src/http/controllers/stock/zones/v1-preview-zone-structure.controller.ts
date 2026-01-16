import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  previewZoneStructureSchema,
  structurePreviewResponseSchema,
} from '@/http/schemas/stock/zones/zone.schema';
import { makePreviewZoneStructureUseCase } from '@/use-cases/stock/zones/factories/make-preview-zone-structure-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function previewZoneStructureController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/zones/:id/structure/preview',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.ZONES.READ,
        resource: 'zones',
      }),
    ],
    schema: {
      tags: ['Stock - Zones'],
      summary: 'Preview zone structure without creating bins',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: previewZoneStructureSchema,
      response: {
        200: structurePreviewResponseSchema,
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;
      const { structure } = request.body;

      try {
        const previewZoneStructureUseCase = makePreviewZoneStructureUseCase();
        const result = await previewZoneStructureUseCase.execute({
          zoneId: id,
          structure,
        });

        return reply.status(200).send(result);
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
