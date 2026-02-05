import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  configureZoneStructureSchema,
  reconfigurationPreviewResponseSchema,
} from '@/http/schemas/stock/zones/zone.schema';
import { makePreviewZoneReconfigurationUseCase } from '@/use-cases/stock/zones/factories/make-preview-zone-reconfiguration-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function previewZoneReconfigurationController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/zones/:id/reconfiguration-preview',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.ZONES.READ,
        resource: 'zones',
      }),
    ],
    schema: {
      tags: ['Stock - Zones'],
      summary: 'Preview zone reconfiguration diff',
      description:
        'Calcula o diff entre a estrutura atual da zona e a nova estrutura proposta sem aplicar alteracoes. Retorna quantos bins serao preservados, criados, deletados e quais bins com itens seriam afetados.',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        structure: configureZoneStructureSchema.shape.structure,
      }),
      response: {
        200: reconfigurationPreviewResponseSchema,
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
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const { structure } = request.body;

      try {
        const previewUseCase = makePreviewZoneReconfigurationUseCase();
        const result = await previewUseCase.execute({
          tenantId,
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
