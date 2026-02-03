import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createZoneSchema,
  zoneResponseSchema,
} from '@/http/schemas/stock/zones/zone.schema';
import { zoneToDTO } from '@/mappers/stock/zone/zone-to-dto';
import { makeCreateZoneUseCase } from '@/use-cases/stock/zones/factories/make-create-zone-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createZoneController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/zones',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.ZONES.CREATE,
        resource: 'zones',
      }),
    ],
    schema: {
      tags: ['Stock - Zones'],
      summary: 'Create a new zone',
      description:
        'Cria uma nova zona de armazenamento dentro de um armazem, com codigo, nome e estrutura de bins.',
      body: createZoneSchema,
      response: {
        201: z.object({
          zone: zoneResponseSchema,
        }),
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
      const { warehouseId, code, name, description, structure, isActive } =
        request.body;

      try {
        const createZoneUseCase = makeCreateZoneUseCase();
        const { zone } = await createZoneUseCase.execute({
          tenantId,
          warehouseId,
          code,
          name,
          description,
          structure,
          isActive,
        });

        return reply.status(201).send({ zone: zoneToDTO(zone) });
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
