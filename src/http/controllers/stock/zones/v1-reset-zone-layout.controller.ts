import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { zoneResponseSchema } from '@/http/schemas/stock/zones/zone.schema';
import { zoneToDTO } from '@/mappers/stock/zone/zone-to-dto';
import { makeResetZoneLayoutUseCase } from '@/use-cases/stock/zones/factories/make-reset-zone-layout-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function resetZoneLayoutController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/zones/:id/layout/reset',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.ZONES.UPDATE,
        resource: 'zones',
      }),
    ],
    schema: {
      tags: ['Stock - Zones'],
      summary: 'Reset zone layout to automatic',
      description:
        'Reseta o layout personalizado de uma zona para o modo automatico, removendo customizacoes de posicionamento.',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          zone: zoneResponseSchema,
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

      try {
        const resetZoneLayoutUseCase = makeResetZoneLayoutUseCase();
        const { zone } = await resetZoneLayoutUseCase.execute({
          tenantId,
          zoneId: id,
        });

        return reply.status(200).send({ zone: zoneToDTO(zone) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
